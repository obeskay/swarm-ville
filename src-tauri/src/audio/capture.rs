use crate::error::{Result, SwarmvilleError};
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::{Stream, StreamConfig};
use std::sync::{Arc, Mutex};

pub struct AudioCapture {
    stream: Option<Stream>,
    buffer: Arc<Mutex<Vec<f32>>>,
    is_recording: bool,
}

impl AudioCapture {
    pub fn new() -> Result<Self> {
        Ok(AudioCapture {
            stream: None,
            buffer: Arc::new(Mutex::new(Vec::new())),
            is_recording: false,
        })
    }

    pub fn start_recording(&mut self) -> Result<()> {
        let host = cpal::default_host();
        let device = host
            .default_input_device()
            .ok_or(SwarmvilleError::Audio("No input device found".to_string()))?;

        let config = device
            .default_input_config()
            .map_err(|e| SwarmvilleError::Audio(e.to_string()))?;

        let sample_rate = config.sample_rate().0;
        tracing::info!("Starting audio capture at {} Hz", sample_rate);

        let buffer = Arc::clone(&self.buffer);

        let stream = device
            .build_input_stream(
                &config.config(),
                move |data: &cpal::InputBuffer, _: &cpal::InputCallbackInfo| {
                    let mut buf = buffer.lock().unwrap();
                    for sample in data.iter() {
                        buf.push(*sample);
                    }
                },
                |err| {
                    eprintln!("Stream error: {}", err);
                },
            )
            .map_err(|e| SwarmvilleError::Audio(e.to_string()))?;

        stream
            .play()
            .map_err(|e| SwarmvilleError::Audio(e.to_string()))?;

        self.stream = Some(stream);
        self.is_recording = true;

        Ok(())
    }

    pub fn stop_recording(&mut self) -> Result<Vec<f32>> {
        self.stream = None;
        self.is_recording = false;

        let mut buffer = self.buffer.lock().unwrap();
        let data = buffer.drain(..).collect();

        Ok(data)
    }

    pub fn is_recording(&self) -> bool {
        self.is_recording
    }

    pub fn get_buffer_size(&self) -> usize {
        self.buffer.lock().unwrap().len()
    }
}

impl Drop for AudioCapture {
    fn drop(&mut self) {
        let _ = self.stop_recording();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_audio_capture_creation() {
        let capture = AudioCapture::new();
        assert!(capture.is_ok());
    }
}
