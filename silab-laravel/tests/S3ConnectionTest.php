#!/usr/bin/env php
<?php

/**
 * AWS S3 Connection Test Script
 * 
 * Jalankan: php artisan tinker < tests/S3ConnectionTest.php
 * Atau copy-paste commands ke: php artisan tinker
 */

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

echo "\n========== AWS S3 Connection Test ==========\n\n";

// Test 1: Check S3 Config
echo "1. Checking S3 Configuration...\n";
$config = config('filesystems.disks.s3');
if ($config) {
    echo "   ✓ S3 disk configuration found\n";
    echo "   - Driver: {$config['driver']}\n";
    echo "   - Region: {$config['region']}\n";
    echo "   - Bucket: {$config['bucket']}\n";
} else {
    echo "   ✗ S3 configuration not found\n";
    exit(1);
}

// Test 2: Check Environment Variables
echo "\n2. Checking Environment Variables...\n";
$accessKey = env('AWS_ACCESS_KEY_ID');
$secretKey = env('AWS_SECRET_ACCESS_KEY');
$region = env('AWS_DEFAULT_REGION');
$bucket = env('AWS_BUCKET');

if (!$accessKey) {
    echo "   ✗ AWS_ACCESS_KEY_ID not set\n";
    exit(1);
}
echo "   ✓ AWS_ACCESS_KEY_ID is set\n";

if (!$secretKey) {
    echo "   ✗ AWS_SECRET_ACCESS_KEY not set\n";
    exit(1);
}
echo "   ✓ AWS_SECRET_ACCESS_KEY is set\n";

if (!$region) {
    echo "   ✗ AWS_DEFAULT_REGION not set\n";
    exit(1);
}
echo "   ✓ AWS_DEFAULT_REGION: {$region}\n";

if (!$bucket) {
    echo "   ✗ AWS_BUCKET not set\n";
    exit(1);
}
echo "   ✓ AWS_BUCKET: {$bucket}\n";

// Test 3: Test Connection
echo "\n3. Testing S3 Connection...\n";
try {
    $testFile = 'test-' . Str::random(8) . '.txt';
    $testContent = "Test connection at " . now()->format('Y-m-d H:i:s');
    
    // Upload test file
    Storage::disk('s3')->put($testFile, $testContent);
    echo "   ✓ File upload successful\n";
    
    // Check if file exists
    if (Storage::disk('s3')->exists($testFile)) {
        echo "   ✓ File verification successful\n";
    } else {
        echo "   ✗ File not found after upload\n";
        exit(1);
    }
    
    // Get file content
    $content = Storage::disk('s3')->get($testFile);
    if ($content === $testContent) {
        echo "   ✓ File content verification successful\n";
    } else {
        echo "   ✗ File content mismatch\n";
        exit(1);
    }
    
    // Get file size
    $size = Storage::disk('s3')->size($testFile);
    echo "   ✓ File size: {$size} bytes\n";
    
    // Get file URL
    $url = Storage::disk('s3')->url($testFile);
    echo "   ✓ File URL: {$url}\n";
    
    // Get temporary URL (signed)
    $tempUrl = Storage::disk('s3')->temporaryUrl($testFile, now()->addMinutes(60));
    echo "   ✓ Temporary URL generated\n";
    
    // Delete test file
    Storage::disk('s3')->delete($testFile);
    echo "   ✓ File deletion successful\n";
    
} catch (\Exception $e) {
    echo "   ✗ Connection test failed: {$e->getMessage()}\n";
    echo "   - Error Code: " . $e->getCode() . "\n";
    exit(1);
}

// Test 4: Test Service
echo "\n4. Testing S3StorageService...\n";
try {
    $service = app(\App\Services\S3StorageService::class);
    echo "   ✓ S3StorageService instantiated\n";
    
    // Check if service methods exist
    $methods = ['uploadFile', 'getUrl', 'getSignedUrl', 'deleteFile'];
    foreach ($methods as $method) {
        if (method_exists($service, $method)) {
            echo "   ✓ Method '{$method}' exists\n";
        } else {
            echo "   ✗ Method '{$method}' not found\n";
            exit(1);
        }
    }
} catch (\Exception $e) {
    echo "   ✗ Service test failed: {$e->getMessage()}\n";
    exit(1);
}

echo "\n========== All Tests Passed! ==========\n";
echo "\nYour AWS S3 is properly configured and working!\n\n";

exit(0);
