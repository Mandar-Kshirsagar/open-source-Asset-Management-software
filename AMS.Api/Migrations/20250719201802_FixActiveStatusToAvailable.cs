using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AMS.Api.Migrations
{
    /// <inheritdoc />
    public partial class FixActiveStatusToAvailable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Fix any 'Active' status values to 'Available' to match the enum
            migrationBuilder.Sql("UPDATE Assets SET Status = 'Available' WHERE Status = 'Active'");
            migrationBuilder.UpdateData(
                table: "Assets",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PurchaseDate" },
                values: new object[] { new DateTime(2025, 7, 19, 20, 18, 1, 662, DateTimeKind.Utc).AddTicks(4487), new DateTime(2025, 1, 19, 20, 18, 1, 662, DateTimeKind.Utc).AddTicks(4477) });

            migrationBuilder.UpdateData(
                table: "Assets",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "PurchaseDate" },
                values: new object[] { new DateTime(2025, 7, 19, 20, 18, 1, 662, DateTimeKind.Utc).AddTicks(4495), new DateTime(2025, 4, 19, 20, 18, 1, 662, DateTimeKind.Utc).AddTicks(4493) });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2025, 7, 19, 20, 18, 1, 662, DateTimeKind.Utc).AddTicks(3538), "$2a$11$EihPBjMYRtQRtoII.sJfq.Opd85Bl1lK5wWWqZ2BQN4XsB/o1vNSG" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
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
    }
}
