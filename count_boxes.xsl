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
		<xsl:param name="name"/>
		<xsl:param name="count"/>
		<xsl:param name="specification"/>
		<xsl:text>  { "code" : "</xsl:text><xsl:value-of select="$code"/><xsl:text>", "name" : "</xsl:text><xsl:value-of select="$name"/><xsl:text>", "number" : "</xsl:text><xsl:value-of select="$count"/><xsl:text>", "specification" : "</xsl:text><xsl:value-of select="$specification"/><xsl:text>" }</xsl:text>
		<xsl:if test="not(position()=last())"><xsl:text>,</xsl:text></xsl:if><xsl:text>
</xsl:text>
	</xsl:template>

	<!-- SampleGroupDescriptionEntry -->
	<xsl:template match="*[@Type = 'sgpd' and not(@grouping_type = '....')]">
		<!--xsl:text>SampleGroupDescriptionEntry/</xsl:text><xsl:value-of select="@Type"/-->
		<xsl:variable name="code" select="@grouping_type"/>
  		<xsl:call-template name="printCount">
            <xsl:with-param name="code"><xsl:value-of select="@grouping_type"/></xsl:with-param>
            <xsl:with-param name="name"><xsl:value-of select="name(.)"/></xsl:with-param>
            <xsl:with-param name="count"><xsl:value-of select="count($usedBoxes//*[@Type = 'sgpd' and @grouping_type = $code])"/></xsl:with-param>
            <xsl:with-param name="specification"><xsl:value-of select="@Specification"/></xsl:with-param>
        </xsl:call-template>
	</xsl:template>

	<!-- FullBoxes that are not SampleGroupDescriptionEntries -->
	<xsl:template match="*[@Type and not(@Type = 'sgpd') and @Version and not(@Type='gnra') and not(@Type='gnrv') ]">
		<!--xsl:text>FullBoxes that are not SampleGroupDescriptionEntries/</xsl:text><xsl:value-of select="@Type"/-->
		<xsl:variable name="boxCode" select="@Type"/>
		<xsl:variable name="boxVersion" select="@Version"/>
  		<xsl:call-template name="printCount">
            <xsl:with-param name="code"><xsl:value-of select="concat(./@Type, ' v', ./@Version, ' flags=', @Flags)"/></xsl:with-param>
            <xsl:with-param name="name"><xsl:value-of select="name(.)"/></xsl:with-param>
            <xsl:with-param name="count"><xsl:value-of select="count($usedBoxes//*[@Type = $boxCode and @Version = $boxVersion])"/></xsl:with-param>
            <xsl:with-param name="specification"><xsl:value-of select="@Specification"/></xsl:with-param>
        </xsl:call-template>
	</xsl:template>

	<!-- Boxes that are not FullBoxes -->
	<xsl:template match="*[@Type and not(@Type = 'sgpd') and not(@Type='gnrm') and not(@Version) and not(local-name(.) = 'TrackReferenceTypeBox') and not(local-name(.)='ItemReferenceBox') and not(local-name(.)='UUIDBox')]">
		<!--xsl:text>Boxes that are not FullBoxes/</xsl:text><xsl:value-of select="@Type"/-->
		<xsl:variable name="boxCode" select="@Type"/>
		<xsl:variable name="number" select="count($usedBoxes//*[@Type = $boxCode])"/>
  		<xsl:call-template name="printCount">
            <xsl:with-param name="code"><xsl:value-of select="$boxCode"/></xsl:with-param>
            <xsl:with-param name="name"><xsl:value-of select="name(.)"/></xsl:with-param>
            <xsl:with-param name="count"><xsl:value-of select="$number"/></xsl:with-param>
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
            <xsl:with-param name="name"><xsl:value-of select="name(.)"/></xsl:with-param>
            <xsl:with-param name="count"><xsl:value-of select="$number"/></xsl:with-param>
            <xsl:with-param name="specification"><xsl:value-of select="@Specification"/></xsl:with-param>
        </xsl:call-template>
	</xsl:template>

	<!-- UUID -->
	<xsl:template match="UUIDBox">
		<!--xsl:text>UUIDBox</xsl:text-->
	</xsl:template>

</xsl:stylesheet>