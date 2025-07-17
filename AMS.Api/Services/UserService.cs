using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using AMS.Api.Data;
using AMS.Api.Models;
using AMS.Api.DTOs;
using AutoMapper;

namespace AMS.Api.Services
{
    public class UserService
    {
        private readonly AMSContext _context;
        private readonly JwtService _jwtService;
        private readonly RefreshTokenService _refreshTokenService;
        private readonly IMapper _mapper;
        private readonly ILogger<UserService> _logger;

        public UserService(AMSContext context, JwtService jwtService, RefreshTokenService refreshTokenService, IMapper mapper, ILogger<UserService> logger)
        {
            _context = context;
            _jwtService = jwtService;
            _refreshTokenService = refreshTokenService;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<LoginResponseDto?> AuthenticateAsync(LoginDto loginDto)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Username == loginDto.Username && u.IsActive);

            if (user == null || !BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash))
            {
                // Introduce a small delay to mitigate user enumeration attacks
                await Task.Delay(new Random().Next(50, 200)); 
                _logger.LogWarning("Login attempt failed: Invalid credentials provided.");
                return null;
            }

            // Update last login
            user.LastLoginAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Generate JWT token and refresh token
            var token = _jwtService.GenerateToken(user);
            var refreshToken = await _refreshTokenService.GenerateRefreshTokenAsync(user.Id);
            var userDto = _mapper.Map<UserDto>(user);

            _logger.LogInformation("User logged in successfully: {Username}", user.Username);

            return new LoginResponseDto
            {
                Token = token,
                RefreshToken = refreshToken,
                User = userDto,
                ExpiresAt = DateTime.UtcNow.AddMinutes(60),
                RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(7)
            };
        }

        public async Task<RefreshTokenResponseDto?> RefreshTokenAsync(string refreshToken)
        {
            var tokenEntity = await _refreshTokenService.ValidateRefreshTokenAsync(refreshToken);
            if (tokenEntity == null)
            {
                return null;
            }

            // Revoke the current refresh token
            await _refreshTokenService.RevokeRefreshTokenAsync(refreshToken);

            // Generate new tokens
            var newToken = _jwtService.GenerateToken(tokenEntity.User);
            var newRefreshToken = await _refreshTokenService.GenerateRefreshTokenAsync(tokenEntity.User.Id);

            _logger.LogInformation("Token refreshed for user: {Username}", tokenEntity.User.Username);

            return new RefreshTokenResponseDto
            {
                Token = newToken,
                RefreshToken = newRefreshToken,
                ExpiresAt = DateTime.UtcNow.AddMinutes(60),
                RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(7)
            };
        }

        public async Task<bool> RevokeTokenAsync(string refreshToken)
        {
            return await _refreshTokenService.RevokeRefreshTokenAsync(refreshToken);
        }

        public async Task<UserDto?> GetUserByIdAsync(int id)
        {
            var user = await _context.Users.FindAsync(id);
            return user != null ? _mapper.Map<UserDto>(user) : null;
        }

        public async Task<IEnumerable<UserDto>> GetAllUsersAsync(bool includeInactive = false)
        {
            var users = includeInactive 
                ? await _context.Users.ToListAsync()
                : await _context.Users.Where(u => u.IsActive).ToListAsync();
            return _mapper.Map<IEnumerable<UserDto>>(users);
        }

        public async Task<UserDto> CreateUserAsync(CreateUserDto createUserDto)
        {
            // Check if username or email already exists
            if (await _context.Users.AnyAsync(u => u.Username == createUserDto.Username))
            {
                throw new InvalidOperationException("Username already exists");
            }

            if (await _context.Users.AnyAsync(u => u.Email == createUserDto.Email))
            {
                throw new InvalidOperationException("Email already exists");
            }

            var user = new User
            {
                Username = createUserDto.Username,
                Email = createUserDto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(createUserDto.Password),
                FirstName = createUserDto.FirstName,
                LastName = createUserDto.LastName,
                Role = createUserDto.Role,
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            _logger.LogInformation("New user created: {Username}", user.Username);

            return _mapper.Map<UserDto>(user);
        }

        public async Task<UserDto?> UpdateUserAsync(int id, UpdateUserDto updateUserDto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return null;
            }

            // Check if email is being changed and if it already exists
            if (updateUserDto.Email != user.Email && 
                await _context.Users.AnyAsync(u => u.Email == updateUserDto.Email))
            {
                throw new InvalidOperationException("Email already exists");
            }

            user.FirstName = updateUserDto.FirstName;
            user.LastName = updateUserDto.LastName;
            user.Email = updateUserDto.Email;
            user.Role = updateUserDto.Role;
            user.IsActive = updateUserDto.IsActive;

            await _context.SaveChangesAsync();

            _logger.LogInformation("User updated: {Username}", user.Username);

            return _mapper.Map<UserDto>(user);
        }

        public async Task<bool> DeleteUserAsync(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return false;
            }

            // Revoke all refresh tokens for the user
            await _refreshTokenService.RevokeAllUserTokensAsync(id, "User deletion");

            user.IsActive = false;
            await _context.SaveChangesAsync();

            _logger.LogInformation("User deactivated: {Username}", user.Username);

            return true;
        }

        public async Task<bool> UpdateUserPasswordAsync(int userId, string currentPassword, string newPassword)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                _logger.LogWarning("Password change failed: User not found - {UserId}", userId);
                return false;
            }

            if (!BCrypt.Net.BCrypt.Verify(currentPassword, user.PasswordHash))
            {
                _logger.LogWarning("Password change failed: Invalid current password for user - {UserId}", userId);
                return false;
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
            await _context.SaveChangesAsync();

            // Revoke all refresh tokens for the user to force re-authentication with the new password
            await _refreshTokenService.RevokeAllUserTokensAsync(userId, "Password change");

            _logger.LogInformation("User password updated: {Username}", user.Username);

            return true;
        }
    }
} 