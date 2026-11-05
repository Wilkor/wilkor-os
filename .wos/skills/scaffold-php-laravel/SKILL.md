# Laravel 11 Expert Scaffold (PHP Backend/Fullstack)

Estrutura profissional para aplicações PHP modernas usando o ecossistema robusto do Laravel.

## 📁 Estrutura de Pastas (Laravel Standard)

```text
/app
  /Http
    /Controllers   # Handlers de requisição
    /Middleware    # Filtros de requisição
  /Models          # Entidades do banco de dados (Eloquent)
  /Providers       # Services providers
/database
  /migrations      # Estrutura do DB
  /seeders         # Dados iniciais
/resources         # Frontend (Views, CSS, JS)
/routes            # Definição de rotas (web.php, api.php)
/tests             # Testes unitários e de feature
artisan            # CLI do Laravel
```

## 🛠️ Comandos de Inicialização

1. **Instalação CLI**: `composer global require laravel/installer`
2. **Criação**: `laravel new project-name` (Siga o wizard para selecionar Starter Kits como Breeze ou Jetstream).
3. **Execução**: `php artisan serve`

## 📄 Boilerplate: routes/api.php (Modern API)

```php
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('/health', function () {
        return response()->json(['status' => 'OK', 'framework' => 'Laravel 11']);
    });

    Route::apiResource('users', UserController::class);
});
```

## 📄 Boilerplate: app/Models/User.php (Eloquent)

```php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name', 'email', 'password',
    ];

    protected $hidden = [
        'password', 'remember_token',
    ];
}
```
