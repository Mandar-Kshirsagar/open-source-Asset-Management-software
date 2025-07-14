# Asset Management System - Development Guide

## 🚀 Getting Started

### Prerequisites
- **.NET 8 SDK** - [Download here](https://dotnet.microsoft.com/download/dotnet/8.0)
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **SQL Server LocalDB** - Included with Visual Studio
- **Git** - [Download here](https://git-scm.com/)
- **Visual Studio 2022** or **VS Code** (recommended)

### Development Environment Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd AMS
   ```

2. **Backend setup:**
   ```bash
   cd AMS.Api
   dotnet restore
   dotnet ef database update
   dotnet run
   ```

3. **Frontend setup (in a new terminal):**
   ```bash
   cd ams-frontend
   npm install
   npm start
   ```

4. **Verify setup:**
   - Backend: https://localhost:7001/swagger
   - Frontend: http://localhost:4200
   - Login with: admin / Admin123!

## 🏗️ Project Structure

### Backend (AMS.Api)

```
AMS.Api/
├── Controllers/           # API endpoints (thin layer)
├── Services/             # Business logic (core functionality)
├── Models/               # Entity models (database structure)
├── DTOs/                # Data transfer objects (API contracts)
├── Data/                # EF Core context and configurations
├── Mapping/             # AutoMapper profiles
├── Middleware/          # Custom middleware components
├── Migrations/          # EF Core database migrations
└── Tests/               # Unit and integration tests
```

### Frontend (ams-frontend)

```
src/app/
├── components/          # Reusable UI components
├── pages/              # Feature modules/pages
├── services/           # API services and business logic
├── models/             # TypeScript interfaces and types
├── guards/             # Route guards (auth, roles)
├── interceptors/       # HTTP interceptors
├── shared/             # Shared utilities and components
└── core/               # Core services and app-wide logic
```

## 📝 Coding Standards

### C# Backend Standards

#### **Naming Conventions**
```csharp
// Classes, Methods, Properties - PascalCase
public class AssetService
{
    public async Task<Asset> GetAssetByIdAsync(int id) { }
    public string AssetName { get; set; }
}

// Parameters, Local Variables - camelCase
public void UpdateAsset(int assetId, string assetName)
{
    var updatedAsset = await GetAssetAsync(assetId);
}

// Constants - UPPER_CASE
public const string DEFAULT_CATEGORY = "UNASSIGNED";

// Private fields - _camelCase
private readonly IAssetService _assetService;
```

#### **Service Layer Pattern**
```csharp
// ✅ Good - Service handles business logic
public class AssetService : IAssetService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AssetService> _logger;

    public async Task<ServiceResult<Asset>> CreateAssetAsync(CreateAssetDto dto)
    {
        try
        {
            // Validation
            if (await IsSerialNumberExistsAsync(dto.SerialNumber))
            {
                return ServiceResult<Asset>.Failure("Serial number already exists");
            }

            // Business logic
            var asset = new Asset
            {
                Name = dto.Name,
                SerialNumber = dto.SerialNumber,
                Status = AssetStatus.Available,
                CreatedAt = DateTime.UtcNow
            };

            _context.Assets.Add(asset);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Asset created with ID {AssetId}", asset.Id);
            return ServiceResult<Asset>.Success(asset);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating asset");
            return ServiceResult<Asset>.Failure("Failed to create asset");
        }
    }
}

// ✅ Good - Controller is thin
[ApiController]
[Route("api/[controller]")]
public class AssetsController : ControllerBase
{
    private readonly IAssetService _assetService;

    [HttpPost]
    public async Task<IActionResult> CreateAsset(CreateAssetDto dto)
    {
        var result = await _assetService.CreateAssetAsync(dto);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
```

#### **Error Handling**
```csharp
// ✅ Use custom result types for service operations
public class ServiceResult<T>
{
    public bool Success { get; set; }
    public string Message { get; set; }
    public T Data { get; set; }
    public List<string> Errors { get; set; } = new();

    public static ServiceResult<T> Success(T data, string message = "Operation successful")
        => new() { Success = true, Data = data, Message = message };

    public static ServiceResult<T> Failure(string message, List<string> errors = null)
        => new() { Success = false, Message = message, Errors = errors ?? new() };
}

// ✅ Global exception handling in middleware
public class GlobalExceptionHandlingMiddleware
{
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        try
        {
            await next(context);
        }
        catch (ValidationException ex)
        {
            await HandleValidationExceptionAsync(context, ex);
        }
        catch (Exception ex)
        {
            await HandleGenericExceptionAsync(context, ex);
        }
    }
}
```

#### **Async/Await Best Practices**
```csharp
// ✅ Always use async suffix
public async Task<Asset> GetAssetAsync(int id)

// ✅ Use ConfigureAwait(false) in services
var asset = await _context.Assets.FindAsync(id).ConfigureAwait(false);

// ✅ Don't mix sync and async
// ❌ Bad
public Asset GetAsset(int id)
{
    return GetAssetAsync(id).Result; // Don't do this!
}

// ✅ Good
public async Task<Asset> GetAssetAsync(int id)
{
    return await _context.Assets.FindAsync(id);
}
```

### TypeScript Frontend Standards

#### **Naming Conventions**
```typescript
// Interfaces - PascalCase with 'I' prefix
interface IAsset {
  id: number;
  name: string;
}

// Classes, Components - PascalCase
export class AssetService { }
export class AssetListComponent { }

// Methods, Properties, Variables - camelCase
public getAssets(): Observable<Asset[]> { }
private assetName: string;

// Constants - UPPER_CASE
export const API_BASE_URL = 'https://localhost:7001/api';

// Files - kebab-case
asset-list.component.ts
asset.service.ts
asset.model.ts
```

#### **Component Structure**
```typescript
// ✅ Good component structure
@Component({
  selector: 'app-asset-list',
  templateUrl: './asset-list.component.html',
  styleUrls: ['./asset-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssetListComponent implements OnInit, OnDestroy {
  // Public properties first
  assets$ = new BehaviorSubject<Asset[]>([]);
  loading$ = new BehaviorSubject<boolean>(false);
  error$ = new BehaviorSubject<string | null>(null);

  // Private properties
  private destroy$ = new Subject<void>();

  constructor(
    private assetService: AssetService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAssets();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Public methods
  onRefresh(): void {
    this.loadAssets();
  }

  onAssetSelect(asset: Asset): void {
    // Handle selection
  }

  // Private methods
  private loadAssets(): void {
    this.loading$.next(true);
    this.assetService.getAssets()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading$.next(false))
      )
      .subscribe({
        next: (assets) => this.assets$.next(assets),
        error: (error) => this.error$.next('Failed to load assets')
      });
  }
}
```

#### **Service Pattern**
```typescript
// ✅ Good service structure
@Injectable({
  providedIn: 'root'
})
export class AssetService {
  private readonly apiUrl = `${environment.apiUrl}/assets`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getAssets(filters?: AssetFilters): Observable<Asset[]> {
    const params = this.buildQueryParams(filters);
    return this.http.get<ApiResponse<Asset[]>>(this.apiUrl, { params })
      .pipe(
        map(response => response.data),
        catchError(this.handleError<Asset[]>('getAssets', []))
      );
  }

  createAsset(asset: CreateAssetRequest): Observable<Asset> {
    return this.http.post<ApiResponse<Asset>>(this.apiUrl, asset)
      .pipe(
        map(response => response.data),
        catchError(this.handleError<Asset>('createAsset'))
      );
  }

  private buildQueryParams(filters?: AssetFilters): HttpParams {
    let params = new HttpParams();
    if (filters?.category) params = params.set('category', filters.category);
    if (filters?.status) params = params.set('status', filters.status);
    return params;
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      // Could send error to logging service here
      return of(result as T);
    };
  }
}
```

## 🧪 Testing Guidelines

### Backend Testing

#### **Unit Tests (using xUnit)**
```csharp
public class AssetServiceTests
{
    private readonly Mock<ApplicationDbContext> _mockContext;
    private readonly Mock<ILogger<AssetService>> _mockLogger;
    private readonly AssetService _service;

    public AssetServiceTests()
    {
        _mockContext = new Mock<ApplicationDbContext>();
        _mockLogger = new Mock<ILogger<AssetService>>();
        _service = new AssetService(_mockContext.Object, _mockLogger.Object);
    }

    [Fact]
    public async Task CreateAssetAsync_ValidInput_ReturnsSuccess()
    {
        // Arrange
        var dto = new CreateAssetDto 
        { 
            Name = "Test Asset", 
            SerialNumber = "TEST123" 
        };

        _mockContext.Setup(x => x.Assets.AnyAsync(It.IsAny<Expression<Func<Asset, bool>>>()))
                   .ReturnsAsync(false);

        // Act
        var result = await _service.CreateAssetAsync(dto);

        // Assert
        Assert.True(result.Success);
        Assert.NotNull(result.Data);
        Assert.Equal("Test Asset", result.Data.Name);
    }

    [Fact]
    public async Task CreateAssetAsync_DuplicateSerial_ReturnsFailure()
    {
        // Arrange
        var dto = new CreateAssetDto { SerialNumber = "DUPLICATE123" };
        
        _mockContext.Setup(x => x.Assets.AnyAsync(It.IsAny<Expression<Func<Asset, bool>>>()))
                   .ReturnsAsync(true);

        // Act
        var result = await _service.CreateAssetAsync(dto);

        // Assert
        Assert.False(result.Success);
        Assert.Contains("already exists", result.Message);
    }
}
```

#### **Integration Tests**
```csharp
public class AssetsControllerIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public AssetsControllerIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = _factory.CreateClient();
    }

    [Fact]
    public async Task GetAssets_ReturnsSuccessStatusCode()
    {
        // Arrange
        var token = await GetValidJwtTokenAsync();
        _client.DefaultRequestHeaders.Authorization = 
            new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.GetAsync("/api/assets");

        // Assert
        response.EnsureSuccessStatusCode();
        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("\"success\":true", content);
    }
}
```

### Frontend Testing

#### **Component Tests (using Jasmine/Karma)**
```typescript
describe('AssetListComponent', () => {
  let component: AssetListComponent;
  let fixture: ComponentFixture<AssetListComponent>;
  let mockAssetService: jasmine.SpyObj<AssetService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('AssetService', ['getAssets']);

    await TestBed.configureTestingModule({
      declarations: [AssetListComponent],
      providers: [
        { provide: AssetService, useValue: spy }
      ],
      imports: [HttpClientTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(AssetListComponent);
    component = fixture.componentInstance;
    mockAssetService = TestBed.inject(AssetService) as jasmine.SpyObj<AssetService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load assets on init', () => {
    // Arrange
    const mockAssets: Asset[] = [
      { id: 1, name: 'Test Asset', serialNumber: 'TEST123' }
    ];
    mockAssetService.getAssets.and.returnValue(of(mockAssets));

    // Act
    component.ngOnInit();

    // Assert
    expect(mockAssetService.getAssets).toHaveBeenCalled();
    component.assets$.subscribe(assets => {
      expect(assets).toEqual(mockAssets);
    });
  });
});
```

#### **Service Tests**
```typescript
describe('AssetService', () => {
  let service: AssetService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(AssetService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch assets', () => {
    // Arrange
    const mockAssets: Asset[] = [
      { id: 1, name: 'Test Asset', serialNumber: 'TEST123' }
    ];
    const mockResponse: ApiResponse<Asset[]> = {
      success: true,
      data: mockAssets,
      message: 'Success'
    };

    // Act
    service.getAssets().subscribe(assets => {
      expect(assets).toEqual(mockAssets);
    });

    // Assert
    const req = httpMock.expectOne(service['apiUrl']);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });
});
```

## 🚀 Build and Deployment

### Development Build
```bash
# Backend
cd AMS.Api
dotnet build
dotnet run

# Frontend
cd ams-frontend
npm run build
npm start
```

### Production Build
```bash
# Backend
dotnet publish -c Release -o ./publish

# Frontend
npm run build:prod
```

### Docker Deployment
```dockerfile
# Dockerfile for API
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY ./publish .
EXPOSE 80
ENTRYPOINT ["dotnet", "AMS.Api.dll"]
```

## 🔄 Git Workflow

### Branch Naming
- **Feature branches**: `feature/asset-management-improvements`
- **Bug fixes**: `bugfix/login-validation-issue`
- **Hotfixes**: `hotfix/critical-security-patch`

### Commit Messages
```bash
# Format: type(scope): description
feat(assets): add asset assignment functionality
fix(auth): resolve JWT token expiration issue
docs(readme): update installation instructions
test(assets): add unit tests for asset service
refactor(services): extract common error handling
```

### Pull Request Process
1. **Create feature branch** from `develop`
2. **Implement changes** following coding standards
3. **Add/update tests** for new functionality
4. **Update documentation** if needed
5. **Submit PR** with clear description
6. **Code review** by team members
7. **Merge to develop** after approval

## 📊 Performance Guidelines

### Backend Performance
```csharp
// ✅ Use IQueryable for database operations
public async Task<IEnumerable<Asset>> GetAssetsAsync(AssetFilters filters)
{
    var query = _context.Assets.AsQueryable();
    
    if (!string.IsNullOrEmpty(filters.Category))
        query = query.Where(a => a.Category == filters.Category);
        
    if (filters.Status.HasValue)
        query = query.Where(a => a.Status == filters.Status);
    
    return await query.ToListAsync();
}

// ✅ Use pagination for large datasets
public async Task<PagedResult<Asset>> GetAssetsPagedAsync(int page, int pageSize)
{
    var totalCount = await _context.Assets.CountAsync();
    var assets = await _context.Assets
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .ToListAsync();
        
    return new PagedResult<Asset>(assets, totalCount, page, pageSize);
}

// ✅ Use caching for frequently accessed data
[MemoryCache(Duration = 300)] // 5 minutes
public async Task<IEnumerable<string>> GetCategoriesAsync()
{
    return await _context.Assets
        .Select(a => a.Category)
        .Distinct()
        .ToListAsync();
}
```

### Frontend Performance
```typescript
// ✅ Use OnPush change detection
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})

// ✅ Use trackBy functions for *ngFor
trackByAssetId(index: number, asset: Asset): number {
  return asset.id;
}

// ✅ Lazy load feature modules
const routes: Routes = [
  {
    path: 'assets',
    loadChildren: () => import('./assets/assets.module').then(m => m.AssetsModule)
  }
];

// ✅ Use async pipe for subscriptions
<div *ngFor="let asset of assets$ | async; trackBy: trackByAssetId">
  {{ asset.name }}
</div>
```

## 🐛 Debugging Tips

### Backend Debugging
1. **Use structured logging**:
   ```csharp
   _logger.LogInformation("Processing asset {AssetId} for user {UserId}", 
                         assetId, userId);
   ```

2. **Configure detailed error pages** in Development:
   ```csharp
   if (app.Environment.IsDevelopment())
   {
       app.UseDeveloperExceptionPage();
   }
   ```

3. **Use EF Core logging** to see SQL queries:
   ```csharp
   protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
   {
       optionsBuilder.LogTo(Console.WriteLine, LogLevel.Information);
   }
   ```

### Frontend Debugging
1. **Use Angular DevTools** browser extension
2. **Enable source maps** in development
3. **Use console.log strategically**:
   ```typescript
   console.log('Asset data:', asset);
   console.table(assets); // Great for arrays
   ```

4. **Use RxJS debugging operators**:
   ```typescript
   this.assetService.getAssets()
     .pipe(
       tap(assets => console.log('Assets loaded:', assets)),
       catchError(error => {
         console.error('Error loading assets:', error);
         return of([]);
       })
     )
     .subscribe();
   ```

## 🤝 Contributing

1. **Read this guide** thoroughly
2. **Follow coding standards** consistently
3. **Write tests** for new functionality
4. **Update documentation** when needed
5. **Ask questions** if anything is unclear

## 📚 Additional Resources

- [ASP.NET Core Documentation](https://docs.microsoft.com/en-us/aspnet/core/)
- [Angular Documentation](https://angular.io/docs)
- [Entity Framework Core Documentation](https://docs.microsoft.com/en-us/ef/core/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [C# Coding Conventions](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/inside-a-program/coding-conventions)