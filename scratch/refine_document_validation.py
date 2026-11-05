with open('backend/app/Http/Controllers/UserBankKycController.php', 'r', encoding='utf-8') as f:
    code = f.read()

old_block = """        // 2. Check if sent as base64 string or stored path
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
        }"""

new_block = """        // 2. Check if sent as base64 string or stored path
        if ($request->has($field)) {
            $inputVal = $request->input($field);
            if (empty($inputVal)) {
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
            }

            if (is_string($inputVal)) {
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
        }

        // 3. Fallback to existing value only if field was omitted entirely from the request
        if (!empty($existingValue)) {
            return [$existingValue, null];
        }"""

if old_block in code:
    code = code.replace(old_block, new_block)
    print("Updated extractAndValidateDocument logic successfully!")
else:
    print("Could not find exact old_block, check whitespace")

with open('backend/app/Http/Controllers/UserBankKycController.php', 'w', encoding='utf-8') as f:
    f.write(code)
