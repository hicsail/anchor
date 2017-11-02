
function viewEvent() {
  window.location = '/' + window.location.pathname.split('/').slice(0,-2).join('/')+'events/name/' + $('#eventName').val();
}

const labels = [];
const names = [];
const datasets = [];
//sort data
for(let event of events) {
  const date = new moment(event.time);
  label = date.format('YYYY-MM-DD');
  if (labels.indexOf(label) === -1) {
    labels.push(label);
  }
  if (names.indexOf(event.name) === -1) {
    names.push(event.name);
  }
}
//create datasets
for(let name of names) {
  datasets.push({
    label: name,
    data: Array.apply(null, Array(labels.length)).map(Number.prototype.valueOf,0),
    backgroundColor: stringToColour(name),
    borderWidth: 1,
  })
}
//populate data set
for(let event of events) {
  let dataset = getDataset(event.name);
  const date = new moment(event.time);
  const label = date.format('YYYY-MM-DD');
  const index = labels.indexOf(label);
  dataset.data[index] += 1;
}

function getDataset(name) {
  for(let data of datasets) {
    if(data.label == name) {
      return data;
    }
  }
  return null;
}

var ctx = $("#eventNameChart");
var myChart = new Chart(ctx, {
  type: 'bar',
  data: {
    labels: labels,
    datasets: datasets
  },
  options: {
    scales: {
      yAxes: [{
        ticks: {
          beginAtZero:true,
          stepSize: 1
        },

      }],
      xAxes: [{
        type: 'time',
      }]
    }
  }
});

function stringToColour(str) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  var colour = '#';
  for (var i = 0; i < 3; i++) {
    var value = (hash >> (i * 8)) & 0xFF;
    colour += ('00' + value.toString(16)).substr(-2);
  }
  return hexToRgbA(colour);
}

function hexToRgbA(hex){
  var c;
  if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
    c= hex.substring(1).split('');
    if(c.length== 3){
      c= [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    c= '0x'+c.join('');
    return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+',1)';
  }
  throw new Error('Bad Hex');
}
