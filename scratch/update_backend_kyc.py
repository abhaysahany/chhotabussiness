with open('backend/app/Http/Controllers/UserBankKycController.php', 'r', encoding='utf-8') as f:
    code = f.read()

# Add Validator and Log imports if missing
if 'use Illuminate\\Support\\Facades\\Validator;' not in code:
    code = code.replace(
        "use Illuminate\\Support\\Facades\\Mail;",
        "use Illuminate\\Support\\Facades\\Mail;\nuse Illuminate\\Support\\Facades\\Validator;\nuse Illuminate\\Support\\Facades\\Log;"
    )

# Replace submitKyc implementation
old_submit_start = """    /**
     * Submit PAN & Aadhaar KYC
     * Requirement: ONLY PAN and Aadhaar Card are required
     */
    public function submitKyc(Request $request)
    {
        $user = auth('sanctum')->user() ?: $request->user();
        if (!$user && $request->filled('user_code')) {
            $user = User::where('user_code', $request->input('user_code'))->first();
        }
        if (!$user && $request->filled('user_id')) {
            $user = User::find($request->input('user_id'));
        }

        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'User not found.'], 404);
        }

        $pan = strtoupper(trim($request->input('pan_number') ?: $request->input('panNumber') ?: ''));
        $aadhaar = preg_replace('/\\D/', '', $request->input('aadhaar_number') ?: $request->input('aadhaarNumber') ?: '');

        if (empty($pan) || strlen($pan) < 10) {
            return response()->json([
                'status' => 'error',
                'message' => 'Valid 10-character PAN Card number is mandatory for Section 194H TDS compliance.',
            ], 422);
        }

        if (empty($aadhaar) || strlen($aadhaar) < 12) {
            return response()->json([
                'status' => 'error',
                'message' => 'Valid 12-digit Aadhaar Card number is mandatory for identity verification.',
            ], 422);
        }

        $user->pan_number = $pan;
        $user->aadhaar_number = $aadhaar;
        if ($request->filled('pan_card_image')) {
            $user->pan_card_image = $request->input('pan_card_image');
        }
        if ($request->filled('aadhaar_front_image')) {
            $user->aadhaar_front_image = $request->input('aadhaar_front_image');
        }
        if ($request->filled('aadhaar_back_image')) {
            $user->aadhaar_back_image = $request->input('aadhaar_back_image');
        }

        $user->kyc_status = 'pending'; // 'pending' / 'under_process' until Admin verifies
        $user->kyc_submitted_at = now();
        $user->save();

        return response()->json([
            'status' => 'success',
            'message' => '🎉 PAN & Aadhaar KYC submitted successfully! Your status is now Under Review ⏳. Admin will verify your documents shortly before payout accounts are enabled.',
            'user' => $user,
        ]);
    }"""

new_submit_impl = """    /**
     * Submit PAN & Aadhaar KYC
     * Requirement: Strict PAN format, exact 12-digit Aadhaar, and validated document uploads
     */
    public function submitKyc(Request $request)
    {
        $user = auth('sanctum')->user() ?: $request->user();
        if (!$user && $request->filled('user_code')) {
            $user = User::where('user_code', $request->input('user_code'))->first();
        }
        if (!$user && $request->filled('user_id')) {
            $user = User::find($request->input('user_id'));
        }

        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'User not found. Please log in again.'], 404);
        }

        // 1. Extract and sanitize inputs
        $rawPan = (string) ($request->input('pan_number') ?: $request->input('panNumber') ?: '');
        $pan = strtoupper(trim($rawPan));

        $rawAadhaar = (string) ($request->input('aadhaar_number') ?: $request->input('aadhaarNumber') ?: '');
        // Strip whitespace and hyphens only (leading zeros preserved)
        $aadhaar = preg_replace('/[\\s-]+/', '', trim($rawAadhaar));

        // 2. Validate PAN and Aadhaar formats using authoritative Laravel validation
        $validator = Validator::make([
            'pan_number' => $pan,
            'aadhaar_number' => $aadhaar,
        ], [
            'pan_number' => ['required', 'string', 'regex:/^[A-Z]{5}[0-9]{4}[A-Z]$/'],
            'aadhaar_number' => ['required', 'string', 'regex:/^[0-9]{12}$/'],
        ], [
            'pan_number.required' => 'PAN number is required.',
            'pan_number.regex' => 'Enter a valid 10-character PAN number (ABCDE1234F).',
            'aadhaar_number.required' => 'Aadhaar number is required.',
            'aadhaar_number.regex' => 'Aadhaar number must contain exactly 12 digits.',
        ]);

        $documentErrors = [];

        // 3. Validate Document Proofs (File upload or Base64 Image)
        [$panImage, $panError] = $this->extractAndValidateDocument(
            $request,
            'pan_card_image',
            $user->pan_card_image,
            'PAN Card'
        );
        if ($panError) {
            $documentErrors['pan_card_image'] = [$panError];
        }

        [$aadhaarFrontImage, $aadhaarFrontError] = $this->extractAndValidateDocument(
            $request,
            'aadhaar_front_image',
            $user->aadhaar_front_image,
            'Aadhaar Front Side'
        );
        if ($aadhaarFrontError) {
            $documentErrors['aadhaar_front_image'] = [$aadhaarFrontError];
        }

        [$aadhaarBackImage, $aadhaarBackError] = $this->extractAndValidateDocument(
            $request,
            'aadhaar_back_image',
            $user->aadhaar_back_image,
            'Aadhaar Back Side'
        );
        if ($aadhaarBackError) {
            $documentErrors['aadhaar_back_image'] = [$aadhaarBackError];
        }

        // 4. Ensure Aadhaar Front and Back are NOT identical
        if ($aadhaarFrontImage && $aadhaarBackImage && trim($aadhaarFrontImage) === trim($aadhaarBackImage)) {
            $documentErrors['aadhaar_back_image'] = ['Front and Back side documents cannot be identical. Please upload both sides independently.'];
        }

        // 5. If validation fails, return structured HTTP 422
        if ($validator->fails() || !empty($documentErrors)) {
            $allErrors = array_merge($validator->errors()->toArray(), $documentErrors);
            $firstMessage = reset($allErrors)[0] ?? 'Please resolve the highlighted KYC validation errors.';
            return response()->json([
                'status' => 'error',
                'message' => $firstMessage,
                'errors' => $allErrors,
            ], 422);
        }

        // 6. Persist validated records
        $user->pan_number = $pan;
        $user->aadhaar_number = $aadhaar;
        if ($panImage) {
            $user->pan_card_image = $panImage;
        }
        if ($aadhaarFrontImage) {
            $user->aadhaar_front_image = $aadhaarFrontImage;
        }
        if ($aadhaarBackImage) {
            $user->aadhaar_back_image = $aadhaarBackImage;
        }

        $user->kyc_status = 'pending'; // 'pending' / 'under_process' until Admin verifies
        $user->kyc_submitted_at = now();
        $user->save();

        // 7. Sensitive data protection: Mask in internal log
        $maskedPan = substr($pan, 0, 5) . '****' . substr($pan, -1);
        $maskedAadhaar = '********' . substr($aadhaar, -4);
        Log::info("KYC submitted for User #{$user->id} ({$user->user_code}). PAN: {$maskedPan}, Aadhaar: {$maskedAadhaar}");

        return response()->json([
            'status' => 'success',
            'message' => '🎉 PAN & Aadhaar KYC submitted successfully! Your status is now Under Review ⏳. Admin will verify your documents shortly before payout accounts are enabled.',
            'user' => $user,
        ]);
    }

    /**
     * Helper to validate and extract document payload (file upload or Base64 data URL)
     *
     * @return array [string|null $payload, string|null $error]
     */
    protected function extractAndValidateDocument(Request $request, string $field, ?string $existingValue, string $label): array
    {
        // 1. Check if uploaded as multipart file
        if ($request->hasFile($field)) {
            $file = $request->file($field);
            if (!$file->isValid()) {
                return [null, "Uploaded {$label} file is invalid or corrupted."];
            }

            $allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
            if (!in_array($file->getMimeType(), $allowedMimes)) {
                return [null, "The {$label} must be a valid image file (JPG, PNG, or WEBP)."];
            }

            if ($file->getSize() > 5 * 1024 * 1024) {
                return [null, "The {$label} document must not exceed 5MB in size."];
            }

            $filename = time() . '_' . uniqid() . '.' . ($file->getClientOriginalExtension() ?: 'jpg');
            $uploadDir = public_path('uploads/kyc_documents');
            if (!file_exists($uploadDir)) {
                @mkdir($uploadDir, 0755, true);
            }
            $file->move($uploadDir, $filename);
            return ['/uploads/kyc_documents/' . $filename, null];
        }

        // 2. Check if sent as base64 string or stored path
        $inputVal = $request->input($field);
        if (!empty($inputVal) && is_string($inputVal)) {
            $trimmed = trim($inputVal);
            if (str_starts_with($trimmed, 'data:image/')) {
                if (!preg_match('/^data:image\\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+\\/=\\r\\n]+)$/', $trimmed, $matches)) {
                    return [null, "The {$label} document must be a valid JPG, PNG, or WEBP image."];
                }

                $imageData = base64_decode($matches[2], true);
                if ($imageData === false) {
                    return [null, "The {$label} document image data could not be decoded."];
                }

                if (strlen($imageData) > 5 * 1024 * 1024) {
                    return [null, "The {$label} document must not exceed 5MB in size."];
                }

                return [$trimmed, null];
            }

            // Existing path or URL previously stored
            if (str_starts_with($trimmed, 'http://') || str_starts_with($trimmed, 'https://') || str_starts_with($trimmed, '/uploads/') || str_starts_with($trimmed, '/storage/')) {
                return [$trimmed, null];
            }

            return [null, "The {$label} document format is not supported."];
        }

        // 3. Fallback to existing value if previously submitted
        if (!empty($existingValue)) {
            return [$existingValue, null];
        }

        if ($field === 'pan_card_image') {
            return [null, 'Please upload a valid PAN Card document.'];
        }
        if ($field === 'aadhaar_front_image') {
            return [null, 'Please upload the Aadhaar Front Side document.'];
        }
        if ($field === 'aadhaar_back_image') {
            return [null, 'Please upload the Aadhaar Back Side document.'];
        }

        return [null, "Please upload a valid {$label} document."];
    }"""

if old_submit_start in code:
    code = code.replace(old_submit_start, new_submit_impl)
    print("Found and replaced submitKyc with strict validation!")
else:
    print("Exact match for old submitKyc not found, need alternative replacement")

with open('backend/app/Http/Controllers/UserBankKycController.php', 'w', encoding='utf-8') as f:
    f.write(code)
print("Updated UserBankKycController.php")
