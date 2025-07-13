using Microsoft.EntityFrameworkCore;
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
        private readonly IMapper _mapper;

        public UserService(AMSContext context, JwtService jwtService, IMapper mapper)
        {
            _context = context;
            _jwtService = jwtService;
            _mapper = mapper;
        }

        public async Task<LoginResponseDto?> AuthenticateAsync(LoginDto loginDto)
        {
            // Debug: Check if user exists
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Username == loginDto.Username && u.IsActive);

            if (user == null)
            {
                // Debug: Log that user was not found
                Console.WriteLine($"User not found: {loginDto.Username}");
                return null;
            }

            // Debug: Check password verification
            var passwordValid = BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash);
            if (!passwordValid)
            {
                Console.WriteLine($"Invalid password for user: {loginDto.Username}");
                return null;
            }

            // Update last login
            user.LastLoginAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var token = _jwtService.GenerateToken(user);
            var userDto = _mapper.Map<UserDto>(user);

            return new LoginResponseDto
            {
                Token = token,
                User = userDto,
                ExpiresAt = DateTime.UtcNow.AddMinutes(60)
            };
        }

        public async Task<UserDto?> GetUserByIdAsync(int id)
        {
            var user = await _context.Users.FindAsync(id);
            return user != null ? _mapper.Map<UserDto>(user) : null;
        }

        public async Task<IEnumerable<UserDto>> GetAllUsersAsync()
        {
            var users = await _context.Users.Where(u => u.IsActive).ToListAsync();
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

            return _mapper.Map<UserDto>(user);
        }

        public async Task<bool> DeleteUserAsync(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return false;
            }

            user.IsActive = false;
            await _context.SaveChangesAsync();

            return true;
        }
    }
} 