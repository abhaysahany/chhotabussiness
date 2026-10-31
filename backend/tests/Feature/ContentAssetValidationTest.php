<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ContentAssetValidationTest extends TestCase
{
    public function test_rejects_image_file_when_content_type_is_video()
    {
        Storage::fake('public');

        $imageFile = UploadedFile::fake()->create('test_image.jpg', 100, 'image/jpeg');

        $response = $this->postJson('/api/admin/content-assets', [
            'title' => 'Sample Video Promo',
            'type' => 'video',
            'category' => 'Promo Videos',
            'entity_type' => 'chhota_business',
            'entity_name' => 'AddNet System Entity',
            'tags' => 'promo, launch',
            'file' => $imageFile,
        ]);

        $response->assertStatus(422);
        $response->assertJson([
            'status' => 'error',
            'message' => 'Please, your selection is video. Please change this content.',
        ]);
    }

    public function test_rejects_video_file_when_content_type_is_image()
    {
        Storage::fake('public');

        $videoFile = UploadedFile::fake()->create('sample_video.mp4', 1000, 'video/mp4');

        $response = $this->postJson('/api/admin/content-assets', [
            'title' => 'Sample Marketing Banner',
            'type' => 'image',
            'category' => 'Marketing Banners',
            'entity_type' => 'chhota_business',
            'entity_name' => 'AddNet System Entity',
            'tags' => 'banner, creative',
            'file' => $videoFile,
        ]);

        $response->assertStatus(422);
        $response->assertJson([
            'status' => 'error',
            'message' => 'Please, your selection is image. Please change this content.',
        ]);
    }

    public function test_accepts_valid_video_file_when_content_type_is_video()
    {
        Storage::fake('public');

        $videoFile = UploadedFile::fake()->create('valid_video.mp4', 2000, 'video/mp4');

        $response = $this->postJson('/api/admin/content-assets', [
            'title' => 'Legitimate Video Promo',
            'type' => 'video',
            'category' => 'Promo Videos',
            'entity_type' => 'chhota_business',
            'entity_name' => 'AddNet System Entity',
            'tags' => 'video, official',
            'file' => $videoFile,
        ]);

        $response->assertStatus(201);
        $response->assertJson([
            'status' => 'success',
            'asset' => [
                'type' => 'video',
                'title' => 'Legitimate Video Promo',
            ],
        ]);

        $this->assertDatabaseHas('content_assets', [
            'title' => 'Legitimate Video Promo',
            'type' => 'video',
        ]);
    }

    public function test_accepts_valid_image_file_when_content_type_is_image()
    {
        Storage::fake('public');

        $imageFile = UploadedFile::fake()->create('valid_banner.png', 100, 'image/png');

        $response = $this->postJson('/api/admin/content-assets', [
            'title' => 'Legitimate Image Banner',
            'type' => 'image',
            'category' => 'Marketing Banners',
            'entity_type' => 'chhota_business',
            'entity_name' => 'AddNet System Entity',
            'tags' => 'banner, official',
            'file' => $imageFile,
        ]);

        $response->assertStatus(201);
        $response->assertJson([
            'status' => 'success',
            'asset' => [
                'type' => 'image',
                'title' => 'Legitimate Image Banner',
            ],
        ]);

        $this->assertDatabaseHas('content_assets', [
            'title' => 'Legitimate Image Banner',
            'type' => 'image',
        ]);
    }
}
