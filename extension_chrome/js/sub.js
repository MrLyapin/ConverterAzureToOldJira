	setInterval(() => {
		run();
	}, 500);

function run() {
	let table = document.getElementsByClassName('pvtTable');
	let button = document.getElementById('copyToClipboardLong');

	if(table.length === 1) {
		if(button === null) {
			let lastBtn = document.getElementById('download-button');
			let btnLong = document.createElement('button');
			let btnShort = document.createElement('button');
			btnLong.innerHTML = '<span class="icon bowtie-icon bowtie-step-insert" style="vertical-align: unset;font-size: large; margin-right: 5px; color: rgb(248,168,0)"></span>Convert long';
			btnShort.innerHTML = '<span class="icon bowtie-icon bowtie-step-shared-insert" style="vertical-align: unset;font-size: large; margin-right: 5px; color: rgb(248,168,0)"></span>Convert Short';
			btnLong.addEventListener('click', function(){
				longRun();
			});
			btnShort.addEventListener('click', function(){
				shortRun();
			});
			let id;
			let type;
			id = document.createAttribute('id');
			type = document.createAttribute('type');
			id.value = "copyToClipboardLong";
			type.value = "button";
			btnLong.setAttributeNode(id);
			btnLong.setAttributeNode(type);
			id = document.createAttribute('id');
			type = document.createAttribute('type');
			type.value = "button";
			id.value = "copyToClipboardShort";
			btnShort.setAttributeNode(id);
			btnShort.setAttributeNode(type);
			lastBtn.parentNode.insertBefore(btnLong, lastBtn.nextSibling);
			lastBtn = document.getElementById('copyToClipboardLong');
			lastBtn.parentNode.insertBefore(btnShort, lastBtn.nextSibling);
		}
	}
}

function longRun() {
	runConverter(1);
}

function shortRun() {
	runConverter(0);
}

function runConverter(typeConvert) {
	try {
		const htmlCollect = document.getElementsByClassName('pvtTable');
		let text = htmlCollect[0].outerHTML;
		const regTR = /(<tr>.+?<\/tr>)/gi;
		const regTH_TD = /(<(t[hd]).*?>.*?<\/\2>)/gi;
		const regColS = /colspan="(.+?)"/i;
		const regRowS = /rowspan="(.+?)"/i;
		const regData = /<(t[hd]).*?>(.*?)<\/\1>/i;
		const trStr = text.match(regTR);
		const countRow = trStr.length;
		const countCol = getCountCol(trStr, regColS, regTH_TD);
		const matrix = getMatrix(countRow, countCol);
		const matrix_long = [];
		const matrix_short = [];
		let temp;
		let col = 0;
		let row = 0;
		let data, type;
		trStr.forEach((itemTR, indexTR) => {
			temp = itemTR.match(regTH_TD);
			temp.forEach((itemTHD, indexTHD) => {
				if(regColS.test(itemTHD)) {
					col = Number(itemTHD.match(regColS)[1]);
				} else {
					col = 1;
				}
				if(regRowS.test(itemTHD)) {
					row = Number(itemTHD.match(regRowS)[1]);
				} else {
					row = 1;
				}
				data = itemTHD.match(regData)[2];
				type = getTypeData(itemTHD);
				setMatrix(matrix, indexTR, col, indexTHD, row, data, type);
			})
		})
		setLongMatrix(matrix_long, matrix);
		setShortMatrix(matrix_short, matrix);

		let jiraLong = getJiraTable(matrix_long);
		let jiraShort = getJiraTable(matrix_short);

		if(typeConvert) {
			chrome.runtime.sendMessage({sendBack:true, data:jiraLong});
		} else {
			chrome.runtime.sendMessage({sendBack:true, data:jiraShort});
		}
	} catch(e) {
		console.log("Something went wrong!" , e.toString());
	}

	function getJiraTable(matrix) {
		let copyMatrix = JSON.parse(JSON.stringify(matrix));
		let jiraArray = [];
		copyMatrix.forEach((item, index)=> {
			jiraArray[index] = item.join("");
		})
		return jiraArray.join("\n");
	}

	function setMatrix(matrix, indexTR, col, indexTHD, row, data, type) {
		let processedData = getProcessedData(data);
		let countCol = matrix[0].length;
		let temp;
		while(matrix[indexTR][indexTHD] != null) {
			indexTHD++;
		}
		for(let i = +indexTR; i < +indexTR + row; i++) {
			for(let j = +indexTHD; j < +indexTHD + col; j++) {
				if(j === countCol -1) {
					temp = processedData;
					processedData = ((type === "th")?"|| ":"| ") + ((i === indexTR && j === (indexTHD + col) - 1)?processedData:"") + ((type === "th")?" || ":" | ");
					matrix[i][j] = processedData;
					processedData = temp;
				} else {
					matrix[i][j] = ((type === "th")?" || ":" | ") + ((i === indexTR && j === (indexTHD + col) - 1)?processedData:"");
				}
			}
		}
	}

	function setLongMatrix(matrix_long, matrix) { // add 4 col
		const regLink = /(\[.+?\|.+?\])/i
		const regTime = /(\d+:\d+)/i;
		const regText = /[\|]{1,2}\s(.+)/i;
		matrix_long.push([" || Tasks || ", "Type || ", "Time || "]);
		const lenRow = matrix.length;
		const lenCol = matrix[0].length;
		let totalTime = "0:00";
		let lastLink;
		let temp;
		for(let i = 3; i < (lenRow -1); i++) {
			temp = regLink.test(matrix[i][2])
			if(temp) {
				lastLink = matrix[i][2].match(regLink)[1];
				matrix_long.push([ " | " + matrix[i][2].match(regLink)[1] + " | ", matrix[i][4].match(regText)[1] + " | ", matrix[i][lenCol -1].match(regTime)[1] + " | "]);
			} else {
				matrix_long.push([ " | " + lastLink + " | ", matrix[i][4].match(regText)[1] + " | ", matrix[i][lenCol -1].match(regTime)[1] + " | "]);
			}
			totalTime = timePlus( totalTime , matrix[i][lenCol -1].match(regTime)[1]);
		}
		matrix_long.push([" || || ", "Total || ", totalTime + " || "]);
	}

	function setShortMatrix(matrix_short, matrix) {
		const regLink = /(\[.+?\|.+?\])/i
		const regTime = /(\d+:\d+)/i;
		matrix_short.push([" || Tasks || ","Time || "]);
		const lenRow = matrix.length;
		const lenCol = matrix[0].length;
		let totalTime = "0:00";
		let temp;
		for(let i = 3; i < (lenRow -1); i++) {
			temp = regLink.test(matrix[i][2])
			if(temp) {
				matrix_short.push([ " | " + matrix[i][2].match(regLink)[1] + " | ", matrix[i][lenCol -1].match(regTime)[1] + " | "]);
			} else {
				matrix_short[matrix_short.length-1][1] = timePlus(matrix_short[matrix_short.length-1][1].match(regTime), matrix[i][lenCol -1].match(regTime)[1]) + " | ";
			}
			totalTime = timePlus( totalTime , matrix[i][lenCol -1].match(regTime)[1]);
		}
		matrix_short.push([" || Total || ", totalTime + " || "]);
	}

	function timePlus(time_a, time_b) {
		let time_1 = "" + time_a;
		let time_2 = "" + time_b;
		let regHour = /(\d+):\d+/i;
		let regMin = /\d+:(\d+)/i;
		let hour_1 = Number(time_1.match(regHour)[1]);
		let hour_2 = Number(time_2.match(regHour)[1]);
		let min_1 = Number(time_1.match(regMin)[1]);
		let min_2 = Number(time_2.match(regMin)[1]);
		let sumHour = 0;
		let extraHour = 0;
		let allMin = 0;

		allMin = min_1 + min_2;
		if(allMin > 59) {
			extraHour = allMin / 60 - ((allMin / 60 ) % 1);
			allMin = allMin % 60;
		}

		sumHour = hour_1 + hour_2 + extraHour;
		if(allMin === 0) {
			allMin = "00";
		}
		return sumHour + ":" + allMin;
	}

	function getTypeData(type) {
		const regTag = /<(th|td).*?>(.*?)<\/\1>/i;
		let tagName = type.match(regTag)[1];
		if(tagName === "th") {
			return "th";
		} else {
			return "td";
		}
	}

	function getProcessedData(data) {
		let regLink = /(<a.*?>.*?<\/a>)/i;
		let processedData;
		if(regLink.test(data)) {
			processedData = getLinkData(data);
		} else {
			processedData = data;
		}
		return processedData;
	}

	function getLinkData(data) {
		const regLink = /<(a).*?href=(["|'])(.*?)\2.*?>(.*?)<\/\1>/i;
		let href = data.match(regLink)[3];
		let text = data.match(regLink)[4];
		return "[" + text + "|" + href + "]";
	}

	function getMatrix(row, col) {
		const matrix = new Array(row);
		for(let i = 0; i < row; i++) {
			matrix[i] = new Array(col).fill(null);
		}
		return matrix;
	}

	function getCountCol(tr, reg, regTH_TD) {
		let col;
		let count = 0;
		tr[0].match(regTH_TD).forEach((td) => {
			if(reg.test(td)) {
				col = Number(td.match(reg)[1]);
				if(col > 1) {
					count += col;
				} else {
					count++;
				}
			} else {
				count++;
			}
		});
		return count;
	}

}
