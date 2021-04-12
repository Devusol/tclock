const fetchData = async (searchTerm) => {
	const response = await axios.get('https://tidesandcurrents.noaa.gov/api/datagetter', {
		params: {
			begin_date: dt.toLocaleString('en-US', {
				month: '2-digit',
				day: '2-digit',
				year: 'numeric'
			}),
			range: '48',
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

	return response.data.predictions;
};

module.exports = fetchData;


function clock() {
	const today = new Date(2020, 1, 5, 12, 35, 35);
	let day = today.toDateString()
	let h = today.getHours();
	let m = today.getMinutes();
	let s = today.getSeconds();
	let AP = h >= 12 ? "PM" : "AM";
	h = checkTime(h);
	m = checkTime(m);
	s = checkTime(s);
	if (h >= 12) {
		h = h - 12;
	}
	console.log(h=h%12);
	document.getElementById('currentTime').innerHTML =
		"<p class='day'>" + day + "</p>" + h + ":" + m + " " + AP;
	let t = setTimeout(clock, 1000);
}
function checkTime(i) {
	if (i < 10) { i = "0" + i };  // add zero in front of numbers < 10
	return i;
}