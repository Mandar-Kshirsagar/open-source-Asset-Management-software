using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AMS.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddRefreshTokensTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RefreshTokens",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Token = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    ExpiryDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsRevoked = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RevokedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RevokedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UserId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RefreshTokens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RefreshTokens_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                table: "Assets",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PurchaseDate" },
                values: new object[] { new DateTime(2025, 7, 13, 13, 32, 33, 630, DateTimeKind.Utc).AddTicks(2098), new DateTime(2025, 1, 13, 13, 32, 33, 630, DateTimeKind.Utc).AddTicks(2086) });

            migrationBuilder.UpdateData(
                table: "Assets",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "PurchaseDate" },
                values: new object[] { new DateTime(2025, 7, 13, 13, 32, 33, 630, DateTimeKind.Utc).AddTicks(2107), new DateTime(2025, 4, 13, 13, 32, 33, 630, DateTimeKind.Utc).AddTicks(2105) });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2025, 7, 13, 13, 32, 33, 630, DateTimeKind.Utc).AddTicks(702), "$2a$11$e0GjoqNVwrkuoQa3.rT66u55Gjirv7p1Hyqhk.KFPtZVbIt4.UaXy" });

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_Token",
                table: "RefreshTokens",
                column: "Token",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_UserId",
                table: "RefreshTokens",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RefreshTokens");

            migrationBuilder.UpdateData(
                table: "Assets",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PurchaseDate" },
                values: new object[] { new DateTime(2025, 7, 12, 8, 25, 29, 385, DateTimeKind.Utc).AddTicks(7972), new DateTime(2025, 1, 12, 8, 25, 29, 385, DateTimeKind.Utc).AddTicks(7959) });

            migrationBuilder.UpdateData(
                table: "Assets",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "PurchaseDate" },
                values: new object[] { new DateTime(2025, 7, 12, 8, 25, 29, 385, DateTimeKind.Utc).AddTicks(7981), new DateTime(2025, 4, 12, 8, 25, 29, 385, DateTimeKind.Utc).AddTicks(7979) });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2025, 7, 12, 8, 25, 29, 385, DateTimeKind.Utc).AddTicks(6789), "$2a$11$gtkHbph75wB5R4//TumQ1.cJMzXBlxTowfbqNxd5u4Go01WTt6YXW" });
        }
    }
}
