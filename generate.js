var path = require('path');
var fs = require('fs');
var child_process = require('child_process');
var xslt4node = require('xslt4node');

var EXTENSIONS = [ "mp4", "3gp", "iso3", "heic", "uvu", "paf", "m4s", "3gs", "mp4m" ];
var DEBUG = true;

var report = function(msg) {
	if (DEBUG) {
		console.log(msg);
	}
}

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
		var command = "MP4Box -dxml "+input_file+" -out "+xml_out+" 2>&1";
		report('Executing '+command);
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
		report('Counting features in '+file.xml);
		xslt4node.addLibrary('./saxon9.jar');
		xslt4node.transform(transform_config, function (err) {
		    if (err) {
		    	console.log("Error counting features for file "+file.xml);
		    	reject(err);
		    } else {
		    	report("Features counted for file "+file.xml);
		    	file.stat = stat_file;
		    	resolve(file);
		    }
		});
	});
	return featurePromise;
}

var processFile = function(input_file) {
	return disoFile(input_file).then(countFeatures, function(err) { console.log("Error processing file: "+input_file)});
}

var addStat = function(agg_stats, key, stat, filename) {
	var code_stat = agg_stats.codes[key];
	if (!code_stat) {
		code_stat = {};
		agg_stats.codes[key] = code_stat;
		code_stat.code = stat.code;
		code_stat.name = stat.name;
		code_stat.version = stat.version;
		code_stat.flags = stat.flags;
		code_stat.specification = stat.specification;
		code_stat.count = 0;
		code_stat.filenames = [];
	}
	var count = parseInt(stat.number);
	code_stat.count += count;
	if (count > 0) {
		code_stat.filenames.push(filename);
	}	
}

var aggregateStats = function(files) {
	report("Aggregating stats for "+files.length+" files");
	var agg_stats = {};
	agg_stats.files = files;
	agg_stats.codes = {};

	for (var i = 0; i < files.length; i++) {
		if (files[i] == undefined) continue;
		var filename = files[i].stat;
		report("Reading file #"+i+": "+filename);
		var string = fs.readFileSync(path.join('.',filename), 'utf8');
		report("Reading file: "+filename+" done.");
		try {
			var stats = JSON.parse(string);
			for (var j = 0; j < stats.length; j++) {
				var stat = stats[j];
				var key;
				//report(stat);
				if (stat.version === '' && stat.flags === '') {
					key = stat.name+"_"+stat.code;
					addStat(agg_stats, key, stat, files[i].iso);
				} else {
					if (stat.version !== '') {
						key = stat.name+"_"+stat.code+"_"+stat.version;
						addStat(agg_stats, key, stat, files[i].iso);
					}
					if (stat.flags !== '') {
						key = stat.name+"_"+stat.code+"_"+stat.flags;
						addStat(agg_stats, key, stat, files[i].iso);
					}
				}
			}
		} catch(e) {
			console.log("Error in processing JSON for "+filename);
			console.log(e);
		}
	}
	report("Aggregating stats: done");
	return agg_stats;
}

var generateHTMLReport = function(agg_stats, htmlOutput) {
	report("Generating HTML report "+htmlOutput);
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
		
		html += '<tr'+(stat.count === 0 ? ' class="missing" ': '')+'>'
		html += '<td>'+stat.code+(stat.version ? ' version='+stat.version : '')+(stat.flags ? ' flags='+stat.flags : '')+'</td>';
		html += '<td>'+stat.name+'</td>';
		html += '<td>'+stat.specification+'</td>';
		html += '<td>'+stat.count+'</td>';
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
	report("HTML report generated: "+htmlOutput);
}

Promise.all(walkSync(process.argv[2] || '.').map(processFile)).then(function (values) {
	generateHTMLReport(aggregateStats(values), process.argv[3] || path.join(process.argv[2] || '.', "conformance_report.html"));
}, function (value) {
	report("Error processing file "+value);
});

