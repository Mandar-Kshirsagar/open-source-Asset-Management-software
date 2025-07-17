using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using AMS.Api.Data;
using AMS.Api.Services;
using AMS.Api.Mapping;
using AMS.Api.Middleware;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;
using Microsoft.OpenApi.Models;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    });

// Configure Caching
builder.Services.AddMemoryCache();

// Configure Rate Limiting
var rateLimitingSettings = builder.Configuration.GetSection("RateLimitingSettings");
var globalLimiterSettings = rateLimitingSettings.GetSection("GlobalLimiter");
var authLimiterSettings = rateLimitingSettings.GetSection("AuthLimiter");

builder.Services.AddRateLimiter(options =>
{
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.User.Identity?.Name ?? context.Request.Headers.Host.ToString(),
            factory: partition => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = globalLimiterSettings.GetValue<int>("PermitLimit"),
                Window = globalLimiterSettings.GetValue<TimeSpan>("Window")
            }));

    options.AddFixedWindowLimiter("Auth", limiterOptions =>
    {
        limiterOptions.PermitLimit = authLimiterSettings.GetValue<int>("PermitLimit");
        limiterOptions.Window = authLimiterSettings.GetValue<TimeSpan>("Window");
        limiterOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        limiterOptions.QueueLimit = authLimiterSettings.GetValue<int>("QueueLimit");
    });
});

// Configure Entity Framework
builder.Services.AddDbContext<AMSContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Configure JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var key = Encoding.ASCII.GetBytes(jwtSettings["SecretKey"]!);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidateAudience = true,
        ValidAudience = jwtSettings["Audience"],
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

// Configure Authorization
builder.Services.AddAuthorization();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp", policy =>
    {
        policy.WithOrigins(builder.Configuration.GetSection("CorsSettings:AllowedOrigins").Get<string[]>() ?? new string[0])
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Configure AutoMapper
builder.Services.AddAutoMapper(typeof(AutoMapperProfile));

// Register Services
builder.Services.AddScoped<JwtService>();
builder.Services.AddScoped<RefreshTokenService>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<AssetService>();
builder.Services.AddScoped<AppSettingService>();

// Register Chatbot Services
builder.Services.AddScoped<IDatabaseSchemaService, DatabaseSchemaService>();
builder.Services.AddScoped<ISqlQueryService, SqlQueryService>();
builder.Services.AddScoped<IAIChatbotService, AIChatbotService>();

builder.Services.AddHttpClient();

// Configure Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "AMS API", Version = "v1" });
    
    // Add JWT authentication to Swagger
    c.AddSecurityDefinition("Bearer", new()
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new()
    {
        {
            new()
            {
                Reference = new() { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    // Global exception handling middleware
    app.UseMiddleware<GlobalExceptionHandler>();

    // Enable HTTPS redirection in production
    app.UseHttpsRedirection();
}

app.UseCors("AllowAngularApp");

// Add security headers middleware
app.Use(async (context, next) =>
{
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("X-Frame-Options", "DENY");
    context.Response.Headers.Append("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self';");
    await next();
});

// Enable rate limiting
app.UseRateLimiter();

app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

if (app.Environment.IsDevelopment())
{
    // Ensure database is created and migrations are applied in development
    using (var scope = app.Services.CreateScope())
    {
        var context = scope.ServiceProvider.GetRequiredService<AMSContext>();
        context.Database.Migrate();
    }
}

app.Run();
