using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using AMS.Api.Data;
using AMS.Api.Models;
using System.Security.Cryptography;
using System.Text;

namespace AMS.Api.Services
{
    public class RefreshTokenService
    {
        private readonly AMSContext _context;
        private readonly ILogger<RefreshTokenService> _logger;

        public RefreshTokenService(AMSContext context, ILogger<RefreshTokenService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<string> GenerateRefreshTokenAsync(int userId)
        {
            var refreshToken = GenerateSecureToken();
            var expiryDate = DateTime.UtcNow.AddDays(7); // 7 days expiry

            var refreshTokenEntity = new RefreshToken
            {
                Token = refreshToken,
                UserId = userId,
                ExpiryDate = expiryDate,
                CreatedAt = DateTime.UtcNow
            };

            _context.RefreshTokens.Add(refreshTokenEntity);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Refresh token generated for user {UserId}", userId);

            return refreshToken;
        }

        public async Task<RefreshToken?> ValidateRefreshTokenAsync(string token)
        {
            var refreshToken = await _context.RefreshTokens
                .Include(rt => rt.User)
                .FirstOrDefaultAsync(rt => rt.Token == token);

            if (refreshToken == null)
            {
                _logger.LogWarning("Invalid refresh token provided");
                return null;
            }

            if (refreshToken.IsRevoked)
            {
                _logger.LogWarning("Revoked refresh token used");
                return null;
            }

            if (refreshToken.ExpiryDate < DateTime.UtcNow)
            {
                _logger.LogWarning("Expired refresh token used");
                return null;
            }

            if (!refreshToken.User.IsActive)
            {
                _logger.LogWarning("Inactive user tried to use refresh token");
                return null;
            }

            return refreshToken;
        }

        public async Task<bool> RevokeRefreshTokenAsync(string token, string? revokedBy = null)
        {
            var refreshToken = await _context.RefreshTokens
                .FirstOrDefaultAsync(rt => rt.Token == token);

            if (refreshToken == null)
            {
                return false;
            }

            refreshToken.IsRevoked = true;
            refreshToken.RevokedAt = DateTime.UtcNow;
            refreshToken.RevokedBy = revokedBy;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Refresh token revoked for user {UserId}", refreshToken.UserId);

            return true;
        }

        public async Task RevokeAllUserTokensAsync(int userId, string? revokedBy = null)
        {
            var userTokens = await _context.RefreshTokens
                .Where(rt => rt.UserId == userId && !rt.IsRevoked)
                .ToListAsync();

            foreach (var token in userTokens)
            {
                token.IsRevoked = true;
                token.RevokedAt = DateTime.UtcNow;
                token.RevokedBy = revokedBy;
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("All refresh tokens revoked for user {UserId}", userId);
        }

        public async Task CleanupExpiredTokensAsync()
        {
            var expiredTokens = await _context.RefreshTokens
                .Where(rt => rt.ExpiryDate < DateTime.UtcNow)
                .ToListAsync();

            _context.RefreshTokens.RemoveRange(expiredTokens);
            await _context.SaveChangesAsync();

            if (expiredTokens.Any())
            {
                _logger.LogInformation("Cleaned up {Count} expired refresh tokens", expiredTokens.Count);
            }
        }

        private string GenerateSecureToken()
        {
            var randomBytes = new byte[32];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(randomBytes);
            }
            return Convert.ToBase64String(randomBytes);
        }
    }
} 