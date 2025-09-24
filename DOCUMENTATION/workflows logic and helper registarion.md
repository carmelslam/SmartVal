Logic of the workflows :
Expertise workflow = initial work flow populates the system with care details , row data and damage centers ASSESSMENT . Registered in the helper.experties , creates universal data junctions fro shared data between workflows, uses the experties section to generate the expertise report
 |
 V 
Estimate workflow - optimize data , focus details and assessments , modify / not modify  - registered in the helper.estimate  that is used to create the estimate report , overrides the UNIVERSAL helper sections that are used for data  junctions . = never writes on expertise helper, just on universal junctions
 |
 V 
Final report workflow= teh final workflow , the finalization of the case , bring actual data to the case after the repairs , invoices and parts selections, modify assessments to actual executions and costs . Overrides UNIVERSAL helper sections, registered in the helper.final report that is used to generate the final report along side the UNIVERSAL helper sections that are used for data junctions and final report generation  . never writes on expertise or estimate helper, just on universal junctions. 


UNIVERSAL helper sections are sections like helper.centers, helper.valuation, helper.calculations, helper.damage_centers, helper.depreciation and so on 
