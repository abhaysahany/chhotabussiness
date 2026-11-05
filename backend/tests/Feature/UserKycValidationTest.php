<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Admin;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class UserKycValidationTest extends TestCase
{
    protected User $user;
    protected string $samplePanImage;
    protected string $sampleAadhaarFront;
    protected string $sampleAadhaarBack;

    protected function setUp(): void
    {
        parent::setUp();

        // 1x1 transparent GIF/PNG as base64 data URLs for testing
        $this->samplePanImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
        $this->sampleAadhaarFront = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
        $this->sampleAadhaarBack = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

        $this->user = User::factory()->create([
            'user_code' => 'CB' . rand(100000, 999999),
            'name' => 'KYC Test User',
            'email' => 'kyc_test_' . uniqid() . '@example.com',
            'password' => Hash::make('password123'),
            'kyc_status' => 'unverified',
        ]);
    }

    public function test_valid_pan_and_aadhaar_submission_succeeds()
    {
        $payload = [
            'user_code' => $this->user->user_code,
            'pan_number' => 'ABCDE1234F',
            'aadhaar_number' => '123456789012',
            'pan_card_image' => $this->samplePanImage,
            'aadhaar_front_image' => $this->sampleAadhaarFront,
            'aadhaar_back_image' => $this->sampleAadhaarBack,
        ];

        $response = $this->actingAs($this->user, 'sanctum')->postJson('/api/user/kyc/submit', $payload);

        $response->assertStatus(200);
        $response->assertJson([
            'status' => 'success',
        ]);

        $this->user->refresh();
        $this->assertEquals('ABCDE1234F', $this->user->pan_number);
        $this->assertEquals('123456789012', $this->user->aadhaar_number);
        $this->assertEquals('pending', $this->user->kyc_status);
        $this->assertNotNull($this->user->kyc_submitted_at);
    }

    public function test_lowercase_pan_is_automatically_converted_to_uppercase()
    {
        $payload = [
            'user_code' => $this->user->user_code,
            'pan_number' => 'abcde1234f',
            'aadhaar_number' => '987654321098',
            'pan_card_image' => $this->samplePanImage,
            'aadhaar_front_image' => $this->sampleAadhaarFront,
            'aadhaar_back_image' => $this->sampleAadhaarBack,
        ];

        $response = $this->actingAs($this->user, 'sanctum')->postJson('/api/user/kyc/submit', $payload);

        $response->assertStatus(200);
        $this->user->refresh();
        $this->assertEquals('ABCDE1234F', $this->user->pan_number);
    }

    public function test_invalid_pan_formats_are_rejected_with_422()
    {
        $invalidPans = [
            'ABC12345F',   // 3 letters, 5 numbers, 1 letter
            '1234567890',   // numbers only
            'ABCDE12345',   // last char is digit
            'ABCDE123@F',   // special character
            'ABCDE1234',    // 9 chars
            'ABCDE12345F',  // 11 chars
            '',             // empty
        ];

        foreach ($invalidPans as $badPan) {
            $payload = [
                'user_code' => $this->user->user_code,
                'pan_number' => $badPan,
                'aadhaar_number' => '123456789012',
                'pan_card_image' => $this->samplePanImage,
                'aadhaar_front_image' => $this->sampleAadhaarFront,
                'aadhaar_back_image' => $this->sampleAadhaarBack,
            ];

            $response = $this->actingAs($this->user, 'sanctum')->postJson('/api/user/kyc/submit', $payload);
            $response->assertStatus(422);
            $response->assertJsonValidationErrors(['pan_number']);
        }
    }

    public function test_aadhaar_with_leading_zeros_is_preserved()
    {
        $payload = [
            'user_code' => $this->user->user_code,
            'pan_number' => 'ABCDE1234F',
            'aadhaar_number' => '012345678901',
            'pan_card_image' => $this->samplePanImage,
            'aadhaar_front_image' => $this->sampleAadhaarFront,
            'aadhaar_back_image' => $this->sampleAadhaarBack,
        ];

        $response = $this->actingAs($this->user, 'sanctum')->postJson('/api/user/kyc/submit', $payload);

        $response->assertStatus(200);
        $this->user->refresh();
        $this->assertEquals('012345678901', $this->user->aadhaar_number);
    }

    public function test_invalid_aadhaar_formats_are_rejected_with_422()
    {
        $invalidAadhaars = [
            '12345678901',    // 11 digits
            '1234567890123',  // 13 digits
            '1234AB789012',   // letters inside
            '1234@56789012',  // special char
            '',               // empty
        ];

        foreach ($invalidAadhaars as $badAadhaar) {
            $payload = [
                'user_code' => $this->user->user_code,
                'pan_number' => 'ABCDE1234F',
                'aadhaar_number' => $badAadhaar,
                'pan_card_image' => $this->samplePanImage,
                'aadhaar_front_image' => $this->sampleAadhaarFront,
                'aadhaar_back_image' => $this->sampleAadhaarBack,
            ];

            $response = $this->actingAs($this->user, 'sanctum')->postJson('/api/user/kyc/submit', $payload);
            $response->assertStatus(422);
            $response->assertJsonValidationErrors(['aadhaar_number']);
        }
    }

    public function test_missing_pan_document_is_rejected_with_422()
    {
        $payload = [
            'user_code' => $this->user->user_code,
            'pan_number' => 'ABCDE1234F',
            'aadhaar_number' => '123456789012',
            'pan_card_image' => null,
            'aadhaar_front_image' => $this->sampleAadhaarFront,
            'aadhaar_back_image' => $this->sampleAadhaarBack,
        ];

        $response = $this->actingAs($this->user, 'sanctum')->postJson('/api/user/kyc/submit', $payload);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['pan_card_image']);
    }

    public function test_missing_aadhaar_front_is_rejected_with_422()
    {
        $payload = [
            'user_code' => $this->user->user_code,
            'pan_number' => 'ABCDE1234F',
            'aadhaar_number' => '123456789012',
            'pan_card_image' => $this->samplePanImage,
            'aadhaar_front_image' => null,
            'aadhaar_back_image' => $this->sampleAadhaarBack,
        ];

        $response = $this->actingAs($this->user, 'sanctum')->postJson('/api/user/kyc/submit', $payload);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['aadhaar_front_image']);
    }

    public function test_missing_aadhaar_back_is_rejected_with_422()
    {
        $payload = [
            'user_code' => $this->user->user_code,
            'pan_number' => 'ABCDE1234F',
            'aadhaar_number' => '123456789012',
            'pan_card_image' => $this->samplePanImage,
            'aadhaar_front_image' => $this->sampleAadhaarFront,
            'aadhaar_back_image' => null,
        ];

        $response = $this->actingAs($this->user, 'sanctum')->postJson('/api/user/kyc/submit', $payload);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['aadhaar_back_image']);
    }

    public function test_identical_aadhaar_front_and_back_is_rejected_with_422()
    {
        $payload = [
            'user_code' => $this->user->user_code,
            'pan_number' => 'ABCDE1234F',
            'aadhaar_number' => '123456789012',
            'pan_card_image' => $this->samplePanImage,
            'aadhaar_front_image' => $this->sampleAadhaarFront,
            'aadhaar_back_image' => $this->sampleAadhaarFront, // IDENTICAL!
        ];

        $response = $this->actingAs($this->user, 'sanctum')->postJson('/api/user/kyc/submit', $payload);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['aadhaar_back_image']);
        $this->assertStringContainsString('identical', $response->json('errors.aadhaar_back_image.0'));
    }

    public function test_multipart_file_uploads_are_validated_and_persisted()
    {
        Storage::fake('public');

        $panFile = UploadedFile::fake()->create('pan_card.jpg', 1500, 'image/jpeg');
        $frontFile = UploadedFile::fake()->create('aadhaar_front.png', 1200, 'image/png');
        $backFile = UploadedFile::fake()->create('aadhaar_back.jpg', 1300, 'image/jpeg');

        $response = $this->actingAs($this->user, 'sanctum')->post('/api/user/kyc/submit', [
            'user_code' => $this->user->user_code,
            'pan_number' => 'ABCDE1234F',
            'aadhaar_number' => '123456789012',
            'pan_card_image' => $panFile,
            'aadhaar_front_image' => $frontFile,
            'aadhaar_back_image' => $backFile,
        ]);

        $response->assertStatus(200);
        $this->user->refresh();
        $this->assertEquals('pending', $this->user->kyc_status);
        $this->assertStringStartsWith('/uploads/kyc_documents/', $this->user->pan_card_image);
    }
}
