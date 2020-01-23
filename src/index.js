
// ref: https://github.com/tensorflow/tfjs-converter/blob/master/demo/mobilenet/mobilenet.js
// ref: https://github.com/tensorflow/tfjs-examples/blob/master/webcam-transfer-learning/index.js

import * as tf_core from '@tensorflow/tfjs-core';
import * as tf from '@tensorflow/tfjs';

import {IMAGENET_CLASSES} from './imagenet_classes';
import {Webcam} from './webcam';
import {isMobile} from './utils';

window.onload = async () => {
  console.log("tfjs-core version:", tf.version_core);

  const model = await tf.loadLayersModel('model.json');

  const webcam = new Webcam(document.getElementById('webcam'));
  const resultDiv = document.getElementById('result');
  try {
    // If on mobile, use the back camera. Otherwise, flip the playback video.
    const facingMode = isMobile() ? 'environment' : 'user';
    if (!isMobile()) {
      webcam.webcamElement.classList.add('flip-horizontally');
    }
    await webcam.setup({'video': {facingMode: facingMode}, 'audio': false});
    console.log('WebCam sccessfully initialized');
  } catch (e) {
    resultDiv.innerHTML =
        'WebCam not available.<br/>' +
        'This demo requires WebCam access with this browser.';
    return;
  }

  // Warm up the model. This uploads weights to the GPU and compiles the WebGL
  // programs so the subsequent execution will be quick.
  tf.tidy(() => {
    const input = webcam.capture();
    model.execute({[INPUT_NODE_NAME]: input}, OUTPUT_NODE_NAME);
  });

  // make the UI ready for recognition
  const guessButton = document.getElementById('guess-button');
  guessButton.classList.remove('blinking');
  guessButton.innerText = 'Guess What ?';

  guessButton.addEventListener('click', () => {

    const predictions = tf.tidy(() => {
      const input = webcam.capture();
      console.log('Invoking model.execute() with input:', input);
      const output = model.execute({[INPUT_NODE_NAME]: input}, OUTPUT_NODE_NAME);
      console.log('output:', output);
      return output.dataSync();
    });

    let predictionList = [];
    for (let i = 0; i < predictions.length; i++) {
      predictionList.push({label: IMAGENET_CLASSES[i], value: predictions[i]});
    }
    predictionList = predictionList.sort((a, b) => {return b.value - a.value;});
    predictionList = predictionList.slice(0, 5);

    resultDiv.innerText = '';
    predictionList.forEach(item => {
      const label = item.label + ',';
      const trimmedLabel = label.substring(0, label.indexOf(','));
      const score = (item.value * 100).toFixed(1);
      const fontSize = Math.min(Math.round(item.value * 200), 100) + 50;
      resultDiv.innerHTML +=
          `<div style="font-size:${fontSize}%;}">${trimmedLabel} : ${score} %</div>`;
    });
  });
};
