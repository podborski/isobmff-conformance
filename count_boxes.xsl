<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                xmlns:isobmff="urn:mpeg:isobmff:schema:file:2016"
                version="1.0">
	
	<xsl:output method="text" standalone="yes" indent="no"/>
	<xsl:strip-space elements="*"/>

	<xsl:variable name="usedBoxes" select="."/>
	<xsl:variable name="possibleBoxes" select="document('boxes.xml')"/>
	<xsl:variable name="possibleStdBoxes" select="$possibleBoxes//*[@Type and not(@Specification = 'gpac' or @Specification = 'apple' or @Specification = 'adobe' or @Specification = 'isma' or @Specification = 'dolby' or @Specification = 'oma' or @Specification = '3gpp' or @Specification = 'dss' or @Specification = 'smooth' or @Specification = 'dece')]"/>

	<xsl:template match="/">
<xsl:text>[
</xsl:text><xsl:apply-templates select="$possibleStdBoxes"/><xsl:text>]</xsl:text>
	</xsl:template>

	<xsl:template name="printCount">
		<xsl:param name="code"/>
		<xsl:param name="version"/>
		<xsl:param name="flags"/>
		<xsl:param name="name"/>
		<xsl:param name="count"/>
		<xsl:param name="specification"/>
		<xsl:text>  { "code" : "</xsl:text><xsl:value-of select="$code"/><xsl:text>", "version" : "</xsl:text><xsl:value-of select="$version"/><xsl:text>", "flags" : "</xsl:text><xsl:value-of select="$flags"/><xsl:text>", "name" : "</xsl:text><xsl:value-of select="$name"/><xsl:text>", "number" : "</xsl:text><xsl:value-of select="$count"/><xsl:text>", "specification" : "</xsl:text><xsl:value-of select="$specification"/><xsl:text>" }</xsl:text>
		<xsl:if test="not(position()=last())"><xsl:text>,</xsl:text></xsl:if><xsl:text>
</xsl:text>
	</xsl:template>

	<!-- Specific SampleGroupDescriptionEntry -->
	<xsl:template match="*[@grouping_type]">
		<!--xsl:text>SampleGroupDescriptionEntry/</xsl:text><xsl:value-of select="@Type"/-->
		<xsl:variable name="code" select="@grouping_type"/>
  		<xsl:call-template name="printCount">
            <xsl:with-param name="code"><xsl:value-of select="@grouping_type"/></xsl:with-param>
            <xsl:with-param name="version"></xsl:with-param>
            <xsl:with-param name="flags"></xsl:with-param>
            <xsl:with-param name="name"><xsl:value-of select="name(.)"/></xsl:with-param>
            <xsl:with-param name="count"><xsl:value-of select="count($usedBoxes//*[@Type = 'sgpd' and @grouping_type = $code])"/></xsl:with-param>
            <xsl:with-param name="specification"><xsl:value-of select="@Specification"/></xsl:with-param>
        </xsl:call-template>
	</xsl:template>

	<!-- FullBoxes that are not a Specific SampleGroupDescriptionEntries and not generic sample entries of GPAC -->
	<xsl:template match="*[not(@grouping_type) and @Version and not(@Type='gnra') and not(@Type='gnrv') ]">
		<!--xsl:text>FullBoxes that are not SampleGroupDescriptionEntries/</xsl:text><xsl:value-of select="@Type"/-->
		<xsl:variable name="boxCode" select="@Type"/>
		<xsl:variable name="boxVersion" select="@Version"/>
		<xsl:variable name="boxFlags" select="@Flags"/>
  		<xsl:call-template name="printCount">
            <xsl:with-param name="code"><xsl:value-of select="./@Type"/></xsl:with-param>
            <xsl:with-param name="version"><xsl:value-of select="./@Version"/></xsl:with-param>
            <xsl:with-param name="flags"><xsl:value-of select="./@Flags"/></xsl:with-param>
            <xsl:with-param name="name"><xsl:value-of select="name(.)"/></xsl:with-param>
            <xsl:with-param name="count"><xsl:value-of select="count($usedBoxes//*[@Type = $boxCode and @Version = $boxVersion and floor(@Flags div $boxFlags) mod 2 = 1])"/></xsl:with-param>
            <xsl:with-param name="specification"><xsl:value-of select="@Specification"/></xsl:with-param>
        </xsl:call-template>
	</xsl:template>


	<!-- TrackReferenceTypeBox -->
	<xsl:template match="TrackReferenceTypeBox">
		<!--xsl:text>TrackReferenceTypeBox/</xsl:text><xsl:value-of select="@Type"/-->
		<xsl:variable name="boxCode" select="@Type"/>
		<xsl:variable name="number" select="count($usedBoxes//isobmff:TrackReferenceTypeBox[@Type = $boxCode])"/>
  		<xsl:call-template name="printCount">
            <xsl:with-param name="code"><xsl:value-of select="$boxCode"/></xsl:with-param>
            <xsl:with-param name="version"></xsl:with-param>
            <xsl:with-param name="flags"></xsl:with-param>
            <xsl:with-param name="name"><xsl:value-of select="name(.)"/></xsl:with-param>
            <xsl:with-param name="count"><xsl:value-of select="$number"/></xsl:with-param>
            <xsl:with-param name="specification"><xsl:value-of select="@Specification"/></xsl:with-param>
        </xsl:call-template>
	</xsl:template>

	<!-- ItemReferenceBox -->
	<xsl:template match="ItemReferenceBox">
		<!--xsl:text>ItemReferenceBox/</xsl:text><xsl:value-of select="@Type"/-->
		<xsl:variable name="boxCode" select="@Type"/>
		<xsl:variable name="number" select="count($usedBoxes//isobmff:ItemReferenceBox[@Type = $boxCode])"/>
  		<xsl:call-template name="printCount">
            <xsl:with-param name="code"><xsl:value-of select="$boxCode"/></xsl:with-param>
            <xsl:with-param name="version"></xsl:with-param>
            <xsl:with-param name="flags"></xsl:with-param>
            <xsl:with-param name="name"><xsl:value-of select="name(.)"/></xsl:with-param>
            <xsl:with-param name="count"><xsl:value-of select="$number"/></xsl:with-param>
            <xsl:with-param name="specification"><xsl:value-of select="@Specification"/></xsl:with-param>
        </xsl:call-template>
	</xsl:template>

	<!-- UUID -->
	<xsl:template match="UUIDBox">
		<!--xsl:text>UUIDBox</xsl:text-->
	</xsl:template>

	<!-- All other boxes that are not FullBoxes, nor TrackReferenceTypeBoxes, nor ItemReferenceBoxes, nor UUIDBoxes -->
	<xsl:template match="*[@Type and not(@grouping_type) and not(@Type='gnrm') and not(@Version) and not(local-name(.) = 'TrackReferenceTypeBox') and not(local-name(.)='ItemReferenceBox') and not(local-name(.)='UUIDBox')]">
		<!--xsl:text>Boxes that are not FullBoxes/</xsl:text><xsl:value-of select="@Type"/-->
		<xsl:variable name="boxCode" select="@Type"/>
		<xsl:variable name="number" select="count($usedBoxes//*[@Type = $boxCode])"/>
  		<xsl:call-template name="printCount">
            <xsl:with-param name="code"><xsl:value-of select="$boxCode"/></xsl:with-param>
            <xsl:with-param name="version"></xsl:with-param>
            <xsl:with-param name="flags"></xsl:with-param>
            <xsl:with-param name="name"><xsl:value-of select="name(.)"/></xsl:with-param>
            <xsl:with-param name="count"><xsl:value-of select="$number"/></xsl:with-param>
            <xsl:with-param name="specification"><xsl:value-of select="@Specification"/></xsl:with-param>
        </xsl:call-template>
	</xsl:template>

</xsl:stylesheet>