use base64::{engine::general_purpose, Engine as _};
use serde::{Deserialize, Serialize};
use std::error::Error;

#[derive(Debug, Serialize, Deserialize)]
pub struct SpriteGenerationRequest {
    pub description: String,
    pub template_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SpriteVariationSpecs {
    pub palette: ColorPalette,
    pub hue_shift: f32,
    pub saturation: f32,
    pub brightness: f32,
    pub style_notes: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ColorPalette {
    pub skin: String,
    pub primary: String,
    pub secondary: String,
    pub accent: String,
    pub outline: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GeneratedSprite {
    pub image_data: String, // Base64 PNG
    pub character_id: u32,
    pub metadata: SpriteMetadata,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SpriteMetadata {
    pub description: String,
    pub style: String,
    pub generated_at: i64,
}

pub struct SpriteGenerator {
    api_key: String,
    client: reqwest::blocking::Client,
}

impl SpriteGenerator {
    pub fn new(api_key: String) -> Self {
        Self {
            api_key,
            client: reqwest::blocking::Client::new(),
        }
    }

    /// Generate sprite using Gemini Flash for color palette generation
    pub fn generate_sprite(
        &self,
        request: SpriteGenerationRequest,
    ) -> Result<GeneratedSprite, Box<dyn Error>> {
        // 1. Get base sprite
        let character_id = self.get_character_id_from_description(&request.description);
        let base_sprite_path = format!(
            "public/sprites/characters/Character_{:03}.png",
            character_id
        );

        // 2. Generate color variation specs with Gemini
        let variation_specs = self.generate_variation_specs(&request.description)?;

        // 3. Load base sprite and apply variations
        let modified_sprite =
            self.apply_variations_to_sprite(&base_sprite_path, &variation_specs)?;

        // 4. Convert to base64
        let image_data = general_purpose::STANDARD.encode(&modified_sprite);

        Ok(GeneratedSprite {
            image_data: format!("data:image/png;base64,{}", image_data),
            character_id,
            metadata: SpriteMetadata {
                description: request.description,
                style: "pixel-art".to_string(),
                generated_at: chrono::Utc::now().timestamp(),
            },
        })
    }

    /// Generate variation specifications using Gemini Flash API
    fn generate_variation_specs(
        &self,
        description: &str,
    ) -> Result<SpriteVariationSpecs, Box<dyn Error>> {
        let prompt = format!(
            "You are a pixel art color palette generator. Based on this character description, generate a color palette and style variations.

Character: {}

Generate ONLY a JSON object with this exact structure:
{{
  \"palette\": {{
    \"skin\": \"#hexcode\",
    \"primary\": \"#hexcode\",
    \"secondary\": \"#hexcode\",
    \"accent\": \"#hexcode\",
    \"outline\": \"#hexcode\"
  }},
  \"hue_shift\": 0,
  \"saturation\": 1.0,
  \"brightness\": 1.0,
  \"style_notes\": \"brief description\"
}}

Example for brave knight:
{{
  \"palette\": {{
    \"skin\": \"#f5d0a9\",
    \"primary\": \"#4a90e2\",
    \"secondary\": \"#2c5aa0\",
    \"accent\": \"#ffd700\",
    \"outline\": \"#000000\"
  }},
  \"hue_shift\": 0,
  \"saturation\": 1.1,
  \"brightness\": 1.0,
  \"style_notes\": \"Blue armor with gold accents\"
}}",
            description
        );

        #[derive(Serialize)]
        struct GeminiRequest {
            contents: Vec<Content>,
            #[serde(rename = "generationConfig")]
            generation_config: GenerationConfig,
        }

        #[derive(Serialize)]
        struct Content {
            parts: Vec<Part>,
        }

        #[derive(Serialize)]
        struct Part {
            text: String,
        }

        #[derive(Serialize)]
        struct GenerationConfig {
            temperature: f32,
            #[serde(rename = "maxOutputTokens")]
            max_output_tokens: u32,
        }

        #[derive(Deserialize)]
        struct GeminiResponse {
            candidates: Vec<Candidate>,
        }

        #[derive(Deserialize)]
        struct Candidate {
            content: ContentResponse,
        }

        #[derive(Deserialize)]
        struct ContentResponse {
            parts: Vec<PartResponse>,
        }

        #[derive(Deserialize)]
        struct PartResponse {
            text: String,
        }

        let request_body = GeminiRequest {
            contents: vec![Content {
                parts: vec![Part { text: prompt }],
            }],
            generation_config: GenerationConfig {
                temperature: 0.8,
                max_output_tokens: 500,
            },
        };

        let url = format!(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key={}",
            self.api_key
        );

        let response = self.client.post(&url).json(&request_body).send()?;

        if !response.status().is_success() {
            return Err(format!("Gemini API error: {}", response.status()).into());
        }

        let gemini_response: GeminiResponse = response.json()?;
        let spec_text = &gemini_response.candidates[0].content.parts[0].text;

        // Parse JSON from response
        let json_match = spec_text
            .find('{')
            .and_then(|start| spec_text.rfind('}').map(|end| &spec_text[start..=end]));

        match json_match {
            Some(json_str) => {
                let specs: SpriteVariationSpecs = serde_json::from_str(json_str)?;
                Ok(specs)
            }
            None => {
                // Return default specs if parsing fails
                Ok(SpriteVariationSpecs {
                    palette: ColorPalette {
                        skin: "#f5d0a9".to_string(),
                        primary: "#4a90e2".to_string(),
                        secondary: "#2c5aa0".to_string(),
                        accent: "#ffd700".to_string(),
                        outline: "#000000".to_string(),
                    },
                    hue_shift: 0.0,
                    saturation: 1.0,
                    brightness: 1.0,
                    style_notes: "Default palette".to_string(),
                })
            }
        }
    }

    /// Apply color variations to sprite image
    fn apply_variations_to_sprite(
        &self,
        sprite_path: &str,
        specs: &SpriteVariationSpecs,
    ) -> Result<Vec<u8>, Box<dyn Error>> {
        use image::{Rgba, RgbaImage};

        // Load base sprite
        let img = image::open(sprite_path)?;
        let mut rgba_img: RgbaImage = img.to_rgba8();

        // Apply HSL transformations to each pixel
        for pixel in rgba_img.pixels_mut() {
            let Rgba([r, g, b, a]) = *pixel;

            // Skip transparent pixels
            if a == 0 {
                continue;
            }

            // Convert RGB to HSL
            let (h, s, l) = rgb_to_hsl(r, g, b);

            // Apply variations
            let new_h = (h + specs.hue_shift).rem_euclid(360.0);
            let new_s = (s * specs.saturation).min(1.0);
            let new_l = (l * specs.brightness).min(1.0);

            // Convert back to RGB
            let (new_r, new_g, new_b) = hsl_to_rgb(new_h, new_s, new_l);

            *pixel = Rgba([new_r, new_g, new_b, a]);
        }

        // Encode to PNG bytes
        let mut png_bytes = Vec::new();
        let mut cursor = std::io::Cursor::new(&mut png_bytes);
        rgba_img.write_to(&mut cursor, image::ImageOutputFormat::Png)?;

        Ok(png_bytes)
    }

    fn get_character_id_from_description(&self, description: &str) -> u32 {
        // Simple hash to character ID (1-83)
        let hash: u32 = description.bytes().map(|b| b as u32).sum();
        (hash % 83) + 1
    }
}

// Color conversion utilities
fn rgb_to_hsl(r: u8, g: u8, b: u8) -> (f32, f32, f32) {
    let r = r as f32 / 255.0;
    let g = g as f32 / 255.0;
    let b = b as f32 / 255.0;

    let max = r.max(g).max(b);
    let min = r.min(g).min(b);
    let delta = max - min;

    let l = (max + min) / 2.0;

    if delta == 0.0 {
        return (0.0, 0.0, l);
    }

    let s = if l > 0.5 {
        delta / (2.0 - max - min)
    } else {
        delta / (max + min)
    };

    let h = if max == r {
        ((g - b) / delta + if g < b { 6.0 } else { 0.0 }) / 6.0
    } else if max == g {
        ((b - r) / delta + 2.0) / 6.0
    } else {
        ((r - g) / delta + 4.0) / 6.0
    };

    (h * 360.0, s, l)
}

fn hsl_to_rgb(h: f32, s: f32, l: f32) -> (u8, u8, u8) {
    let h = h / 360.0;

    let hue_to_rgb = |p: f32, q: f32, mut t: f32| -> f32 {
        if t < 0.0 {
            t += 1.0;
        }
        if t > 1.0 {
            t -= 1.0;
        }
        if t < 1.0 / 6.0 {
            return p + (q - p) * 6.0 * t;
        }
        if t < 1.0 / 2.0 {
            return q;
        }
        if t < 2.0 / 3.0 {
            return p + (q - p) * (2.0 / 3.0 - t) * 6.0;
        }
        p
    };

    let (r, g, b) = if s == 0.0 {
        (l, l, l)
    } else {
        let q = if l < 0.5 {
            l * (1.0 + s)
        } else {
            l + s - l * s
        };
        let p = 2.0 * l - q;

        (
            hue_to_rgb(p, q, h + 1.0 / 3.0),
            hue_to_rgb(p, q, h),
            hue_to_rgb(p, q, h - 1.0 / 3.0),
        )
    };

    (
        (r * 255.0).round() as u8,
        (g * 255.0).round() as u8,
        (b * 255.0).round() as u8,
    )
}

// Add chrono dependency for timestamps
use std::time::{SystemTime, UNIX_EPOCH};

mod chrono {
    use super::*;

    pub struct Utc;

    impl Utc {
        pub fn now() -> DateTime {
            DateTime
        }
    }

    pub struct DateTime;

    impl DateTime {
        pub fn timestamp(&self) -> i64 {
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs() as i64
        }
    }
}
