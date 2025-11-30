# TensorFlow Lite Models

This directory contains quantized TFLite models for embedded deployment.

## Models

### yolov5n_int8.tflite
- **Type**: Object Detection
- **Quantization**: INT8
- **Input**: 320x320x3 RGB image
- **Output**: Bounding boxes + class predictions
- **Size**: ~4MB

### mobilenet_v2_int8.tflite
- **Type**: Image Classification
- **Quantization**: INT8
- **Input**: 224x224x3 RGB image
- **Output**: 1000 class probabilities
- **Size**: ~3.4MB

## Usage

Place actual `.tflite` model files in this directory. The models listed above are references - download or generate them as needed.

## Generating Models

```python
import tensorflow as tf

# Example: Convert and quantize a model
converter = tf.lite.TFLiteConverter.from_saved_model('model_path')
converter.optimizations = [tf.lite.Optimize.DEFAULT]
converter.target_spec.supported_types = [tf.int8]
tflite_model = converter.convert()

with open('model_int8.tflite', 'wb') as f:
    f.write(tflite_model)
```

## Notes

- Models should be quantized to INT8 for NPU deployment
- Test models with `netron` or TFLite benchmark tools before deployment
- Large models (>10MB) should use Git LFS
