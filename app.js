const dataFile = "./public/data/config.json";
let configData = require("./public/data/config.json");

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const _ = require("lodash");
const fs = require("fs");
const { exec } = require("child_process");
const axios = require("axios");
const weather = require("openweather-apis");


const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let todayPredictions = [];

let displayTide = [{
  "t": 0,
  "type": "X"
}];
let displayTides = [{
  "t": 0,
  "type": "X"
}];

// let fsWait = false;
//redirectPort();
// fs.watch(dataFile, (event, filename) => {
//   if (filename) {
//     if (fsWait) return;
//     fsWait = setTimeout(() => {
//       fsWait = false;
//     }, 100);

//     cycleApp();
//   }
// });
//mongoose.connect('mongodb://localhose/postDB', {useNewUrlParser: true});
//getClose();

app.get("/home", function (req, res) {
  let day = new Date();
  let currentWeather;

  if (configData.connected) {
    
    weather.setLang('en');
    weather.setAPPID('d5c9e5a43c9e232a823985e3ba4de6cc');
    weather.setZipCode(configData.zipcode);
    weather.setUnits('imperial');
    currentWeather = weather.getSmartJSON(function (err, smart) {
      currentWeather = smart;
    });

    fetchData(configData.stationID).then((predictions) => {
      predictions.forEach((element, index) => {
        const predDate = new Date(element.t.toLocaleString());
        let hours = predDate.getHours();
        let minutes = predDate.getMinutes();
        let AP = hours >= 12 ? "pm" : "am";


        //hours = hours % 12;

        // To display "0" as "12" 
        //hours = hours ? hours : 12;
        hours = hours < 10 ? '0' + hours : hours;
        minutes = minutes < 10 ? '0' + minutes : minutes;
        //console.log(index, predDate, predictions[index]);
        predictions[index].t = hours + ":" + minutes;
        predictions[index].ap = AP;
        displayTide[index] = predictions[index];
        /*  if (day > new Date(element.t)) {
           //console.log("Already Happened", hours + ":" + minutes, index)
           predictions[index].t = hours + ":" + minutes;
           predictions[index].ap = AP;
           displayTide[0] = predictions[index];
           displayTide[1] = predictions[index + 1];
           displayTide[2] = predictions[index + 2];
           displayTide[3] = predictions[index + 3];
 
           //console.log(`${Date(day).toLocaleString()}<${Date(element).toLocaleString()}`);
         }
         if (day < new Date(element.t)) {
           console.log("Still Coming", new Date(element.t.toLocaleString()), index)
           predictions[index].t = hours + ":" + minutes;
           predictions[index].ap = AP;
           //console.log(`${Date(day).toLocaleString()}<${Date(element).toLocaleString()}`);
         } */
        if (day == new Date(element.t)) {
          // Reload();
        }


      });

      /* if (displayTide[1] == 0) {
        Reload()
      }else { */
      displayTides[0] = displayTide[0];
      displayTides[1] = displayTide[1];
      displayTides[2] = displayTide[2];
      displayTides[3] = displayTide[3];

      console.log(currentWeather);
      console.log(displayTides);
      res.render("home", {
        location: configData.location, station: configData.stationID,
        tides: displayTides, wifiCon: configData.connected, conditions: currentWeather.description,
        temperature: Math.trunc(currentWeather.temp), weatherIcon: currentWeather.weathercode,
        theme: configData.bgTheme
      }); //, conditionImage: imageUrl 
      //}
    });
  } else {
    res.render("welcome");
  }
});

// app.get("/wireless", function (req, res) {
//   const entries = Object.entries(configData);
//   let networks;
//   let networkConfig;
//   function getNetworks() {
//     iwlist.scan({ iface: 'wlan0', sudo: true }, function (err, res) {
//       // console.log(res.ssid);
//       networks = res;
//       ifconfig.status('eth0', function (err, status) {
//         // console.log(status.ipv4_address);
//         networkConfig = status.ipv4_address;
//         displayNetworks();
//       });
//     });
//   }
//   function displayNetworks() {
//     // console.log(networks);
//     res.render("wireless", { configuration: entries, networks: networks, ipadd: networkConfig, eth: "na", wlan: "na" });
//   }
//   getNetworks(displayNetworks);
// });


// app.post("/wireless", function (req, res) {
//   wifiOptions.ssid = req.body.ssid;
//   wifiOptions.passphrase = req.body.password;
//   killAP();
//   killDNS();
//   connectTo(wifiOptions);
//   Reload();
//   res.redirect("/wireless");

// });

app.get("/", function (req, res) {

  const entries = Object.entries(configData);
  //const tideStation = document.getElementsByTagName("iframe")[0].contentWindow;
  // console.log(tideStation.document.getElementsByClassName("modal-title"));

  res.render("location", {
    configuration: entries, theme: configData.bgTheme, location: configData.location,
    station: configData.stationID, zipcode: configData.zipcode
  });
});

app.post("/", function (req, res) {

  configData.location = req.body.inputLocation;
  configData.stationID = req.body.inputStation;
  configData.bgTheme = req.body.bgTheme;
  configData.zipcode = req.body.inputZipcode;

  console.log(req.body.inputLocation, configData);
  updateConfig().then(res.redirect("/home"));
    // then(Reload()).
    

});

app.listen(5006, function () {
  console.log("Server started on port 5000");
  // Reload();
});


const fetchData = async (searchTerm) => {
  const response = await axios.get('https://tidesandcurrents.noaa.gov/api/datagetter', {
    params: {
      begin_date: new Date().toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      }),
      range: '72',
      station: searchTerm,
      product: 'predictions',
      datum: 'mllw',
      interval: 'hilo',
      units: 'english',
      time_zone: 'lst_ldt',
      format: 'json'
    }
  });

  if (response.data.error) {
    return [];
  }
  //console.log(response.data.predictions);
  return response.data.predictions;
};

// const Reload = () => {
//   exec('sudo killall chromium-browse; DISPLAY=:0 chromium-browser  --noerrdialogs --disable-infobars --disable-notifications --check-for-update-interval=31536000 --kiosk --app=http://localhost:5000/home', (err, stdout, stderr) => {
//     if (err) {
//       //some err occurred
//       console.error(err)
//     } else {
//       // the *entire* stdout and stderr (buffered)
//       console.log(`stdout: ${stdout}`);
//       console.log(`stderr: ${stderr}`);
//     }
//   });
// };

// const connectTo = () => {
//   wpa_supplicant.enable(wifiOptions, function (err) {
//     console.log(err);
//   });
// };

// const cycleApp = () => {
//   exec("./cyclenode.sh", (error, stdout, stderr) => {
//     if (error) {
//       console.log(`error: ${error.message}`);
//       return;
//     }
//     if (stderr) {
//       console.log(`stderr: ${stderr}`);
//       return;
//     }
//     console.log(stdout);
//   });
// };

// const killDNS = () => {
//   exec("sudo systemctl stop dnsmasq.service", (error, stdout, stderr) => {
//     if (error) {
//       console.log(`error: ${error.message}`);
//       return;
//     }
//     if (stderr) {
//       console.log(`stderr: ${stderr}`);
//       return;
//     }
//     console.log(stdout);
//   });
// };

const updateConfig = async () => {
  await fs.writeFile(dataFile, JSON.stringify(configData), (err) => {
    if (err) console.log(err);
    console.log("configuration file updated")
  })
}

/* const setTheme = () => {
  let darkTheme = document.getElementById('dark');
  let lightTheme = document.getElementById('light');
  let currentTheme = configData.bgTheme;
  console.log(darkTheme, lightTheme, currentTheme);
}
 */
//setTheme();

/*
function checkTime(i) {
  if (i < 10) { i = "0" + i };  // add zero in front of numbers < 10
  return i;
}



const checkConnect = async () => {
  await exec("ping 8.8.8.8 -Iwlan0 -c2 -W2", (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      configData.connected = false;
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      configData.connected = false;
      return;
    }
    //console.log(stdout);
    configData.connected = true;
    updateConfig();
  });
};

const redirectPort = () => {
  exec("sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-ports 5000", (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
    console.log(stdout);
  });
};

const startDNS = () => {
  exec("sudo systemctl start dnsmasq.service", (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
    console.log(stdout);
  });
};
function getClose() {
  const today = new Date();
  let day = today;
  let h = today.getHours();
  let m = today.getMinutes();
  let s = today.getSeconds();
  h = checkTime(h);
  m = checkTime(m);
  s = checkTime(s);

  setTimeout(getClose, 1000);
  // console.log(new Date(todayPredictions.reduce(closest)).toLocaleString());
  // console.log(new Date(closest).toLocaleString()); // Output: 7

  //console.log(displayTide);
}*/





