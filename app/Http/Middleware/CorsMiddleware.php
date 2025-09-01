<?php
namespace App\Http\Middleware;

use Closure;

class CorsMiddleware
{
    public function handle($request, Closure $next)
    {
        $headers = [
            'Access-Control-Allow-Origin'      => '*',
            'Access-Control-Allow-Methods'     => 'POST, GET, OPTIONS, PUT, DELETE',
            'Access-Control-Allow-Credentials' => 'true',
            'Access-Control-Max-Age'           => '86400',
            'Access-Control-Allow-Headers'     => 'Content-Type, Authorization, X-Requested-With'
        ];

        if ($request->isMethod('OPTIONS')) {
            return response()->json('{"method":"OPTIONS"}', 200, $headers);
        }

        $response = $next($request);
        foreach($headers as $key => $value) {
            $response->header($key, $value);
        }

        return $response;
    }
}

// bootstrap/app.php (add this line after $app = new Laravel\Lumen\Application)
/*
// Enable CORS
$app->middleware([
    App\Http\Middleware\CorsMiddleware::class
]);
*/

// composer.json dependencies needed:
/*
{
    "require": {
        "laravel/lumen-framework": "^10.0",
        "google/apiclient": "^2.0",
        "guzzlehttp/guzzle": "^7.0"
    }
}
*/