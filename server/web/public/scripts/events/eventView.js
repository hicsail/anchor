function viewEvent() {
  window.location.href = window.location.href.split('/').slice(0,-1).join('/')+'/' + $('#eventName').val();
}

const events = {
  labels: [],
  data:[]
};
for(let event of data) {
  const date = new moment(event.time);
  label = date.format('YYYY-MM-DD')
  let index = events.labels.indexOf(label);
  if (index === -1) {
    events.labels.push(label);
    index = events.labels.length -1;
    events.data[index] = 1;
  } else {
    events.data[index] += 1;
  }
}
var ctx = $("#eventNameChart");
var myChart = new Chart(ctx, {
  type: 'bar',
  data: {
    labels: events.labels,
    datasets: [{
      type: 'bar',
      label: 'Events',
      data: events.data,
      backgroundColor: 'rgba(33,150,243,0.75)',
      borderColor: 'rgba(33,150,243,1)',
      borderWidth: 2
    }]
  },
  options: {
    legend: {
      display: false
    },
    scales: {
      yAxes: [{
        ticks: {
          beginAtZero:true,
          stepSize: 1
        },

      }],
      xAxes: [{
        type: 'time'
      }]
    }
  }
});
