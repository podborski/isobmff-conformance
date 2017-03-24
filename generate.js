var path = require('path');
var fs = require('fs');
var child_process = require('child_process');
var xslt4node = require('xslt4node');

var EXTENSIONS = [ "mp4", "3gp", "iso3", "heic", "uvu", "paf", "m4s", "3gs" ];

var walkSync = function(dir, filelist) {
    files = fs.readdirSync(dir);
    filelist = filelist || [];
    files.forEach(function(file) {
        if (fs.statSync(path.join(dir, file)).isDirectory()) {
            filelist = walkSync(path.join(dir, file), filelist);
        }
        else {
        	if (EXTENSIONS.some(function(ext) { 
        		return file.endsWith(ext); 
        	})) {
            	filelist.push(path.join(dir, file));
            }
        }
    });
    return filelist;
};

var disoFile = function(input_file) {
	var disoPromise = new Promise(function(resolve, reject) {
		var xml_out = input_file+"_diso.xml";
		var command = "MP4Box -diso "+input_file+" -out "+xml_out+" 2>&1";
		console.log('Executing '+command);
		child_process.exec(command, {maxBuffer: 1024 * 500}, function (err, stdout, stderr) {
			console.log(stdout);			
			if (err) {
				reject(err);
			} else {
				resolve({ iso: input_file, xml: xml_out});
			}
		});
	})
	return disoPromise;
}

var countFeatures = function(file) {
	var featurePromise = new Promise(function(resolve, reject) {
		var stat_file = file.xml+"_features.json";
		var transform_config = {
		    xsltPath: path.join(__dirname, "count_boxes.xsl"),
		    sourcePath: file.xml,
		    result: stat_file,
		    params: {
		    },
		    props: {
		        indent: 'yes'
		    }
		};
		console.log('Counting features in '+file.xml);
		xslt4node.addLibrary('./saxon9.jar');
		xslt4node.transform(transform_config, function (err) {
		    if (err) {
		    	console.log("Error counting features for file "+file.xml);
		    	reject(err);
		    } else {
		    	console.log("Features counted for file "+file.xml);
		    	file.stat = stat_file;
		    	resolve(file);
		    }
		});
	});
	return featurePromise;
}

var processFile = function(input_file) {
	return disoFile(input_file).then(countFeatures);
}

var aggregateStats = function(files) {
	console.log("Aggregating stats for "+files.length+" files");
	var agg_stats = {};
	agg_stats.files = files;
	agg_stats.codes = {};

	for (var i = 0; i < files.length; i++) {
		var filename = files[i].stat;
		console.log(filename);
		var string = fs.readFileSync(path.join('.',filename), 'utf8');
		//console.log(string);
		try {
			var stats = JSON.parse(string);
			for (var j = 0; j < stats.length; j++) {
				var stat = stats[j];
				var count = parseInt(stat.number);
				//console.log(stat);
				var code_stat = agg_stats.codes[stat.name+"_"+stat.code];
				if (!code_stat) {
					code_stat = {};
					agg_stats.codes[stat.name+"_"+stat.code] = code_stat;
					code_stat.code = stat.code;
					code_stat.name = stat.name;
					code_stat.specification = stat.specification;
					code_stat.count = 0;
					code_stat.filenames = [];
				}
				code_stat.count += count;
				if (count > 0) {
					code_stat.filenames.push(files[i].iso);
				}
			}
		} catch(e) {
			console.log("Error in processing JSON for "+filename);
			console.log(e);
		}
	}
	console.log("Aggregating stats: done");
	return agg_stats;
}

var generateHTMLReport = function(agg_stats, htmlOutput) {
	console.log("Generating HTML report "+htmlOutput);
	var html = fs.readFileSync('conformance_report_header.html', 'utf8');
	html += '<p>Number of conformance files: '+agg_stats.files.length+'</p>';
	html += '<p>Number of 4CC defined in the standards: '+Object.keys(agg_stats.codes).length+'</p>';
	html += "<table>";
	html += "<thead>";	
	html += "<tr><th>4CC</th><th>Type</th><th>Specification</th><th>Count</th><th class='files'>Files</th></tr>";
	html += "</thead>";	
	html += "<tbody>";	
	for (var key in agg_stats.codes) {
		var stat = agg_stats.codes[key];
		html += '<tr'+(stat.count === 0 ? ' class="missing" ': '')+'><td>'+stat.code+'</td><td>'+stat.name+'</td><td>'+stat.specification+'</td><td>'+stat.count+'</td>';
		html +='<td class="files">';
		for (var i = 0; i < stat.filenames.length; i++) {		
			if (i > 0) {
				html += ', ';
			}
			html += stat.filenames[i];
		}
		html +='</td></tr>';
	}
	html += "</tbody>";	
	html += "</table>";	
	html += "<p>Generated on "+(new Date())+"</p>";
	html += "</body>";	
	html += "</html>";	
	fs.writeFileSync(htmlOutput, html);
	console.log("HTML report generated: "+htmlOutput);
}

Promise.all(walkSync(process.argv[2] || '.').map(processFile)).then(function (values) {
	generateHTMLReport(aggregateStats(values), process.argv[3] || path.join(process.argv[2] || '.', "conformance_report.html"));
}, function (value) {
	console.log("Error processing file "+value);
});

