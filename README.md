*The chatbot widget (chatwidget.js) uses React client-side hooks, so it should be treated as a client component. Please ensure "use client" is preserved at the top when integrating into a Next.js App Router setup.*

 Overview

This chatbot integration allows Hopjob users to interact with a smart assistant powered by Google's Gemini models (via the Gemini API). The assistant provides **contextual navigation help** within the Hopjob platform based on pre-defined platform features.

---

 Files Included

* `ChatController.php` — Controller for handling chat requests
* `CorsMiddleware.php` — Middleware to allow cross-origin requests (if not already set up)
* `service-account.json` — Google service account credentials (⚠️ not included here — add it manually)
* This `README.md`

---

 Requirements

Ensure your Laravel backend meets the following:

### Laravel Version:

* Laravel 9 or 10

### PHP Version:

* PHP 8.0 or higher

### Composer Dependencies:

Add these to your `composer.json` (if not already present):

```json
"require": {
  "google/apiclient": "^2.0",
  "google/auth": "^1.47",
  "guzzlehttp/guzzle": "^7.0"
}
```

Then run:

```bash
composer update
```

---

 Integration Steps

### 1. Add the Controller

Copy `ChatController.php` into:

```
app/Http/Controllers/ChatController.php
```

Adjust namespace if your project uses a custom structure.

---

### 2. Add Routes

In your `routes/api.php`, add:

```php
use App\Http\Controllers\ChatController;

Route::post('/chat', [ChatController::class, 'handleChat']);
Route::get('/test-auth', [ChatController::class, 'testAuth']);
```

These will expose:

* `POST /api/chat` – Sends message to Gemini
* `GET /api/test-auth` – Tests service account and Gemini API connectivity

---

### 3. Set Up Google Credentials

1. Place your Google Cloud **service account key** in:

```
storage/credentials/service-account.json
```

2. Add the following to your `.env`:

```env
GOOGLE_APPLICATION_CREDENTIALS=storage/credentials/service-account.json
```

Make sure the path is relative to the root of the Laravel project.

---

### 4. (Optional) Enable CORS

If your Laravel app does **not already** allow cross-origin requests, you can:

#### a. Add Middleware

Copy `CorsMiddleware.php` to:

```
app/Http/Middleware/CorsMiddleware.php
```

#### b. Register Middleware

In `app/Http/Kernel.php`, inside `$middleware`, add:

```php
\App\Http\Middleware\CorsMiddleware::class,
```

Or, use Laravel’s `fruitcake/laravel-cors` package for a more flexible approach.

---

## 🧪 Testing

### Test API connectivity

```bash
GET /api/test-auth
```

Should return:

```json
{
  "success": true,
  "message": "Service account authentication and API access successful",
  ...
}
```

### Send Chat Message

```bash
POST /api/chat
Content-Type: application/json

{
  "message": "How do I upload my CV?"
}
```

Should return a helpful response like:

```json
{
  "response": "To upload your CV, go to 'Build Your CV' in the left sidebar..."
}
```

---

 Important Notes

* Your service account must have permissions to use the **Gemini API**
* Make sure Gemini API is enabled in your GCP project
* Billing must be enabled for access to paid models (e.g., `gemini-1.5-pro`)
* The controller tries multiple models in fallback order: `gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-pro`

---




