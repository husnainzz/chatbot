<?php

$router->get('/', function () use ($router) {
    return $router->app->version();
});

$router->post('/chat', 'ChatController@handleChat');
$router->get('/test-auth', 'ChatController@testAuth');