const webcamElement = document.getElementById('webcam');
const classifier = knnClassifier.create();
let toggle, net;
const audio = document.createElement('audio');
let counter, soundNum = 0;
let time = 5000;
let notificationStyle = 'visual'

const PUBLIC_VAPID_KEY=
"BAGjBfYNPrkiNYVvK5B_T6TGETQwaYiMWzeNLqoGyBFaQQKpVMOU3m7ZYNCqeyIYzA2g_5cu3LYSMRo3TpYJXb8"

//WEB PUSH NOTIFICATIONS
  // Register SW, register push, send push
async function send() {
  // Register Service Worker
  const register = await navigator.serviceWorker.register("/sw.js", {
    scope: "/"
  });

  // Register Push
  const subscription = await register.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
  });

  // Send Push Notification
  await fetch("/subscribe", {
    method: "POST",
    body: JSON.stringify(subscription),
    headers: {
      "content-type": "application/json"
    }
  });
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

//LOAD WEBCAM
async function setupWebcam() {
  return new Promise((resolve, reject) => {
    const navigatorAny = navigator;
    navigator.getUserMedia = navigator.getUserMedia ||
        navigatorAny.webkitGetUserMedia || navigatorAny.mozGetUserMedia ||
        navigatorAny.msGetUserMedia;
    if (navigator.getUserMedia) {
      navigator.getUserMedia({video: true},
        stream => {
          webcamElement.srcObject = stream;
          webcamElement.addEventListener('loadeddata',  () => resolve(), false);
        },
        error => reject());
    } else {
      reject();
    }
  });
}

//LOAD MOBILENET
async function load() {
  console.log('Loading mobilenet..');
  // Load the model.
  net = await mobilenet.load();
  console.log('Sucessfully loaded model');
  await setupWebcam();
}

//IMAGE RECEIVER
const addExample = classId => {
  // Get the intermediate activation of MobileNet 'conv_preds' and pass that to the KNN classifier.
  const activation = net.infer(webcamElement, 'conv_preds');
  // Pass the intermediate activation to the classifier and associate it with a specific class index.
  classifier.addExample(activation, classId);
};

//IMAGE ASSESSOR
async function checkSlouch() {
  let classes;
  let result;
  if (classifier.getNumClasses() > 0) {
    // Get the activation from mobilenet from the webcam.
    const activation = net.infer(webcamElement, 'conv_preds');
    // Get the most likely class and confidences from the classifier module.
    result = await classifier.predictClass(activation);
    classes = ['A', 'B'];
    predictions.innerText = `
      prediction: ${classes[result.classIndex]}\n
      probability: ${result.confidences[result.classIndex]}`;
  }
  console.log("RESULT", classes[result.classIndex])

  if (classes[result.classIndex] === 'B') {
    if (notificationStyle === 'audio') {
      audio.src = `audio/${soundNum}.mp3`
      audio.load();
      audio.play();
      soundNum === 3 ? soundNum = 0 : soundNum++;
    } else if (notificationStyle === 'visual') {
      if ('serviceWorker' in navigator) {
        send().catch(err => console.error(err));
      }
    }
    counter = 0;
  } else {
    counter++;
    //EXPERIMENT WITH REWARD
    // if (counter === 5) {
    //   audio.src = "audio/song.mp3"
    //   audio.load();
    //   audio.play();
    //   // alert.innerText = "You made it so long!"
    // //   counter = 0;
    // } else {
    //   // alert.innerText = "Good!"
    // }
  }
  //Wait for next frame to fire.
  await tf.nextFrame();
}

//DOM ELEMENTS
let train = document.getElementById('train');
let right = document.getElementById('right')
let wrong = document.getElementById('wrong')
let start = document.getElementById('start');
let stop = document.getElementById('stop');
let webcam = document.getElementById('webcam');
let monitoring = document.getElementById('monitoring');
let alert = document.getElementById('alert');
let resume = document.getElementById('resume');
let predictions = document.getElementById('predictions');
let frequency = document.getElementById('frequency');
let question = document.getElementById('question');
let again = document.getElementById('again');
let notification = document.getElementById('notification');
let options = document.getElementById('option');
let visualNot = document.getElementById('visual');
let audioNot = document.getElementById('audio');

//COLLECTIONS OF ELEMENTS FOR VIEWS
let trainingView = [webcam, right, wrong, start, train, frequency, question, notification, options];
let monitoringView = [right, wrong, start, stop, monitoring, frequency, question, notification, options];
let resumeView = [stop, resume, again, webcam, monitoring];

//HELPER FUNCTIONS FOR EVENT LISTENERS
function showView(elements) {
    elements.forEach(ele => ele.hidden = !ele.hidden)
}

function operating(view) {
    showView(view)
    toggle = setInterval(checkSlouch, time);
}

//EVENT LISTENERS
  //Control views
train.addEventListener('click', () => {
  showView(trainingView);
  if (!resume.hidden) {
    resume.hidden = !resume.hidden;
  }
});

again.addEventListener('click', () => {
  showView([...trainingView, train, again]);
  if (!resume.hidden) {
    resume.hidden = !resume.hidden;
  }
});

frequency.addEventListener('change', (e) => {
  time = +e.target.value;
})

start.addEventListener('click', () => {
  operating(monitoringView);
  if (!resume.hidden) {
    resume.hidden = !resume.hidden;
  }
  counter = 0;
});

stop.addEventListener('click', () => {
  clearInterval(toggle);
  audio.pause();
  showView([...trainingView, ...monitoringView, resume, train, again])
})

resume.addEventListener('click', () => {
  counter = 0;
  operating(resumeView);
});

visualNot.addEventListener('click', () => {
  notificationStyle = 'visual'
})

audioNot.addEventListener('click', () => {
  notificationStyle = 'audio'
})

  //Adds example to class
right.addEventListener('click', () => addExample(0));
wrong.addEventListener('click', () => addExample(1));

load();

