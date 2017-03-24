Software to generate MPEG Conformance reports

#Dependencies
This software is developed in JavaScript for NodeJS. It uses the following tools which should be installed on the system:
- MP4Box from the GPAC project
- Java with the Saxon XSLT library (provided as saxon9.jar)

#Install
npm install

#Run
node generate.js [folder [report] ]
- folder is the name of the folder for which the report should be generated. The default is "."
- report is the name of the HTML file. The default is conformance_report.html, generated in the given folder

#Process
The program first scans all folders for files with some specific extensions (see EXTENSIONS in generate.js).

Then, for each file, it calls MP4Box -diso to generate an XML dump of the structure of the file.

Then, for each XML, it calls an XSL transformation (count_boxes.xsl) to count the number of boxes used in the file and produce a JSON file per input file. 

The XSLT uses a list of boxes defined in the different standards. This is the file "boxes.xml". This file was produced using "MP4Box -boxes" and by augmenting the result with the contents of the file "boxes-not-supported-by-mp4box.xml". 

Finally, the program then aggregates incrementally all JSON files and generates the HTML report (using the template conformance_report_header.html).