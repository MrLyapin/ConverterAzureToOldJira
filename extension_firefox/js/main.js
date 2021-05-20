let timerId;
chrome.runtime.onMessage.addListener(function(details) {
	copyToClipboard(details)
});

function showNotification() {
	if(document.getElementById('notification')) {
		document.getElementById('notification').remove();
		if(timerId) {
			clearTimeout(timerId);
		}
	}
	let element = document.createElement('div');
	element.innerHTML = '<div class="headerN">Notification</div>\n' +
						'\t<div class="messageN">Converted and copied to clipboard!</div>';
	let id = document.createAttribute('id');
	let cls = document.createAttribute('class');
	id.value = "notification";
	cls.value = "popupN";
	element.setAttributeNode(id);
	element.setAttributeNode(cls);
	document.body.append(element)
	timerId = setTimeout(function () {
		document.getElementById('notification').remove();
	}, 3000)
}

function copyToClipboard(text) {
	navigator.clipboard.writeText(text)
		.then(() => {
			showNotification();
		})
		.catch(err => {
			console.log("Copy reporting: Something went wrong", err);
		});
}
