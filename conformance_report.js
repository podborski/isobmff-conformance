function show() {
	document.querySelectorAll('.hidden').forEach(function (i) { i.classList.remove('hidden');});
}

function hideFiles() {
	document.querySelectorAll('.files').forEach(function (i) { i.classList.add('hidden');});	
}

function showProblems() {
	document.querySelectorAll('tbody tr:not(.missing)').forEach(function (i) { i.classList.add('hidden');});	
}