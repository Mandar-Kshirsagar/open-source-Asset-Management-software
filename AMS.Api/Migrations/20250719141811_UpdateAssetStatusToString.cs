using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace AMS.Api.Migrations
{
    /// <inheritdoc />
    public partial class UpdateAssetStatusToString : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Assets",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.CreateTable(
                name: "AppSettings",
                columns: table => new
                {
                    Key = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Value = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppSettings", x => x.Key);
                });

            migrationBuilder.InsertData(
                table: "AppSettings",
                columns: new[] { "Key", "Value" },
                values: new object[,]
                {
                    { "CompanyLogoUrl", "/images/default_logo.png" },
                    { "CompanyName", "Asset Management System" },
                    { "DefaultLanguage", "en-US" },
                    { "DefaultTheme", "light" }
                });

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AppSettings");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Assets",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50);

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
        }
    }
}
