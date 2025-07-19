using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AMS.Api.Migrations
{
    /// <inheritdoc />
    public partial class FixAssetStatusEnumMapping : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Assets",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PurchaseDate" },
                values: new object[] { new DateTime(2025, 7, 19, 20, 12, 25, 188, DateTimeKind.Utc).AddTicks(3826), new DateTime(2025, 1, 19, 20, 12, 25, 188, DateTimeKind.Utc).AddTicks(3813) });

            migrationBuilder.UpdateData(
                table: "Assets",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "PurchaseDate" },
                values: new object[] { new DateTime(2025, 7, 19, 20, 12, 25, 188, DateTimeKind.Utc).AddTicks(3840), new DateTime(2025, 4, 19, 20, 12, 25, 188, DateTimeKind.Utc).AddTicks(3838) });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2025, 7, 19, 20, 12, 25, 188, DateTimeKind.Utc).AddTicks(2284), "$2a$11$YPdY2QlZgbPjSuz7m.jdt.EnlMQrtL6sS.2gzBVgQE80/Wyj0EtqW" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Assets",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PurchaseDate" },
                values: new object[] { new DateTime(2025, 7, 19, 14, 18, 2, 459, DateTimeKind.Utc).AddTicks(7769), new DateTime(2025, 1, 19, 14, 18, 2, 459, DateTimeKind.Utc).AddTicks(7753) });

            migrationBuilder.UpdateData(
                table: "Assets",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "PurchaseDate" },
                values: new object[] { new DateTime(2025, 7, 19, 14, 18, 2, 459, DateTimeKind.Utc).AddTicks(7779), new DateTime(2025, 4, 19, 14, 18, 2, 459, DateTimeKind.Utc).AddTicks(7777) });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2025, 7, 19, 14, 18, 2, 459, DateTimeKind.Utc).AddTicks(6027), "$2a$11$QdmTRctk/h1gWzQe6gm8GuN/.hDTnxmPx2L4DJO3u5ujYuaOK0Uw2" });
        }
    }
}
