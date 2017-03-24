<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                xmlns:isobmff="urn:mpeg:isobmff:schema:file:2016"
                version="1.0">
	
	<xsl:output method="html" standalone="yes" indent="no"/>

	<xsl:variable name="usedBoxes" select="document(/Files/File/@name)"/>
	<xsl:variable name="possibleBoxes" select="document('boxes.xml')"/>
	<xsl:variable name="possibleStdBoxes" select="$possibleBoxes//*[@Type and not(@Specification = 'gpac' or @Specification = 'apple' or @Specification = 'adobe' or @Specification = 'isma' or @Specification = 'dolby' or @Specification = 'oma' or @Specification = '3gpp' or @Specification = 'dss' or @Specification = 'smooth')]"/>

	<xsl:template match="/">
		<html>
			<head>
				<style>
					table, td, th {
						border: 1px solid black;
						border-collapse: collapse;						
						text-align: center;
					}

					.missing {
						background-color: red;
					}
					.hidden {
						display: none;
					}
				</style>
				<script src="conformance_report.js"></script>
			</head>
			<body>
				<h1>Conformance report</h1>
				<p>Number of conformance files: <xsl:value-of select="count(/Files/File)"/></p>
				<p>Number of 4CC defined in the standards: 
				<xsl:value-of select="count($possibleStdBoxes)"/></p>
				<button onclick="showProblems()">Hide non-problematic 4CC</button>
				<button onclick="hideFiles()">Hide file lists</button>
				<button onclick="show()">Show all</button>	
				<table>
					<thead><tr><th>4CC</th><th>Type</th><th>Specification</th><th>Count</th><th class="files">Files</th></tr></thead>
					<tbody>
						<xsl:apply-templates select="$possibleStdBoxes"/>
					</tbody>
				</table>
				<xsl:if test="count($usedBoxes//isobmff:UnknownBox)">
					<p>Note: The conformance files have 4CC not supported in the XML serialization:
						<table>
						<thead><tr><th>4CC</th><th class="files">Files</th></tr></thead>
						<tbody>
						<xsl:for-each select="$usedBoxes//isobmff:UnknownBox">
							<xsl:sort select="title/@class"/>
							<tr class="missing"><td><xsl:value-of select="./@Type"/></td><td class="files"><a href="{./ancestor::*/@Name}"><xsl:value-of select="./ancestor::*/@Name"/></a></td></tr>
						</xsl:for-each>
						</tbody>
						</table>
					</p>
				</xsl:if>
				<xsl:if test="count($usedBoxes//isobmff:UUIDBox)">
					<p>Note: The conformance files have UUID boxes:
						<table>
						<thead><tr><th>UUID</th><th class="files">Files</th></tr></thead>
						<tbody>
						<xsl:for-each select="$usedBoxes//isobmff:UUIDBox">
							<tr class="missing"><td><xsl:value-of select="./@UUID"/></td><td class="files"><a href="{./ancestor::*/@Name}"><xsl:value-of select="./ancestor::*/@Name"/></a></td></tr>
						</xsl:for-each>
						</tbody>
						</table>
					</p>
				</xsl:if>
				<p>Generated on <xsl:value-of  select="current-dateTime()"/></p>
			</body>
		</html>
	</xsl:template>

	<!-- SampleGroupDescriptionEntry -->
	<xsl:template match="*[@Type = 'sgpd' and not(@grouping_type = '....')]">
		<xsl:variable name="code" select="@grouping_type"/>
		<xsl:variable name="number" select="count($usedBoxes//*[@Type = 'sgpd' and @grouping_type = $code])"/>
		<tr>
			<xsl:if test="$number = 0">
				<xsl:attribute name="class">missing</xsl:attribute>
			</xsl:if>
			<td>
				<xsl:value-of select="@grouping_type"/>
			</td>
			<td>
				<xsl:value-of select="name(.)"/>
			</td>
			<td>
				<xsl:value-of select="@Specification"/>
			</td>
			<td>
				<xsl:value-of select="$number"/>
			</td>
			<td class="files">				
				<xsl:for-each select="$usedBoxes//*[@Type = 'sgpd' and @grouping_type = $code]/ancestor::*/@Name">
					<a href="{.}"><xsl:value-of select="."/></a><br/>
				</xsl:for-each>
			</td>
		</tr>
	</xsl:template>

	<!-- FullBoxes that are not SampleGroupDescriptionEntries -->
	<xsl:template match="*[@Type and not(@Type = 'sgpd') and @Version and not(@Type='gnra') and not(@Type='gnrv') ]">
		<xsl:variable name="boxCode" select="@Type"/>
		<xsl:variable name="boxVersion" select="@Version"/>
		<xsl:variable name="number" select="count($usedBoxes//*[@Type = $boxCode and @Version = $boxVersion])"/>
		<tr>
			<xsl:if test="$number = 0">
				<xsl:attribute name="class">missing</xsl:attribute>
			</xsl:if>
			<td>
				<xsl:value-of select="concat(./@Type, ' v', ./@Version, ' flags=', @Flags)"/>
			</td>
			<td>
				<xsl:value-of select="name(.)"/>
			</td>
			<td>
				<xsl:value-of select="@Specification"/>
			</td>
			<td>
				<xsl:value-of select="$number"/>
			</td>
			<td class="files">				
				<xsl:for-each select="$usedBoxes//*[@Type = $boxCode and @Version = $boxVersion]/ancestor::*/@Name">
					<a href="{.}"><xsl:value-of select="."/></a><br/>
				</xsl:for-each>
			</td>
		</tr>		
	</xsl:template>

	<!-- Boxes that are not FullBoxes -->
	<xsl:template match="*[@Type and not(@Type = 'sgpd') and not(@Type='gnrm') and not(@Version) and not(local-name(.) = 'TrackReferenceTypeBox') and not(local-name(.)='ItemReferenceBox') and not(local-name(.)='UUIDBox')]">
		<xsl:variable name="boxCode" select="@Type"/>
		<xsl:variable name="number" select="count($usedBoxes//*[@Type = $boxCode])"/>
		<tr>
			<xsl:if test="$number = 0">
				<xsl:attribute name="class">missing</xsl:attribute>
			</xsl:if>
			<td>
				<xsl:value-of select="$boxCode"/>
			</td>
			<td>
				<xsl:value-of select="name(.)"/>
			</td>
			<td>
				<xsl:value-of select="@Specification"/>
			</td>
			<td>
				<xsl:value-of select="$number"/>
			</td>
			<td class="files">				
				<xsl:for-each select="$usedBoxes//*[@Type = $boxCode]/ancestor::*/@Name">
					<a href="{.}"><xsl:value-of select="."/></a><br/>
				</xsl:for-each>
			</td>
		</tr>
	</xsl:template>

	<!-- TrackReferenceTypeBox -->
	<xsl:template match="TrackReferenceTypeBox">
		<xsl:variable name="boxCode" select="@Type"/>
		<xsl:variable name="number" select="count($usedBoxes//isobmff:TrackReferenceTypeBox[@Type = $boxCode])"/>
		<tr>
			<xsl:if test="$number = 0">
				<xsl:attribute name="class">missing</xsl:attribute>
			</xsl:if>
			<td>
				<xsl:value-of select="$boxCode"/>
			</td>
			<td>
				<xsl:value-of select="name(.)"/>
			</td>
			<td>
				<xsl:value-of select="@Specification"/>
			</td>
			<td>
				<xsl:value-of select="$number"/>
			</td>
			<td class="files">				
				<xsl:for-each select="$usedBoxes//isobmff:TrackReferenceTypeBox[@Type = $boxCode]/ancestor::*/@Name">
					<a href="{.}"><xsl:value-of select="."/></a><br/>
				</xsl:for-each>
			</td>
		</tr>
	</xsl:template>

	<!-- ItemReferenceBox -->
	<xsl:template match="ItemReferenceBox">
		<xsl:variable name="boxCode" select="@Type"/>
		<xsl:variable name="number" select="count($usedBoxes//isobmff:ItemReferenceBox[@Type = $boxCode])"/>
		<tr>
			<xsl:if test="$number = 0">
				<xsl:attribute name="class">missing</xsl:attribute>
			</xsl:if>
			<td>
				<xsl:value-of select="$boxCode"/>
			</td>
			<td>
				<xsl:value-of select="name(.)"/>
			</td>
			<td>
				<xsl:value-of select="@Specification"/>
			</td>
			<td>
				<xsl:value-of select="$number"/>
			</td>
			<td class="files">				
				<xsl:for-each select="$usedBoxes//isobmff:ItemReferenceBox[@Type = $boxCode]/ancestor::*/@Name">
					<a href="{.}"><xsl:value-of select="."/></a><br/>
				</xsl:for-each>
			</td>
		</tr>
	</xsl:template>

	<!-- UUID -->
	<xsl:template match="UUIDBox">
	</xsl:template>

</xsl:stylesheet>