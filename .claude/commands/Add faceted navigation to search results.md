Add faceted navigation to search results
04/09/2025
Faceted navigation is used for self-directed filtering on query results in a search app, where your application offers form controls for scoping search to groups of documents (for example, categories or brands), and Azure AI Search provides the data structures and filters to back the experience.

In this article, learn the steps for returning a faceted navigation structure in Azure AI Search. Once you're familiar with basic concepts and clients, continue to Facet examples for syntax about various use cases, including basic faceting and distinct counts.

More facet capabilities are available through preview APIs:

hierarchical facet structures
facet filtering
facet aggregations
Facet navigation examples provide the syntax and usage for the preview features.

Faceted navigation in a search page
Facets are dynamic because they're based on each specific query result set. A search response brings with it all of the facet buckets used to navigate the documents in the result. The query executes first, and then facets are pulled from the current results and assembled into a faceted navigation structure.

In Azure AI Search, facets are one layer deep and can't be hierarchical unless you use the preview API. If you aren't familiar with faceted navigation structures, the following example shows one on the left. Counts indicate the number of matches for each facet. The same document can be represented in multiple facets.

Screenshot of faceted search results.

Facets can help you find what you're looking for, while ensuring that you don't get zero results. As a developer, facets let you expose the most useful search criteria for navigating your search index.

Faceted navigation in code
Facets are enabled on supported fields in an index, and then specified on a query. The faceted navigation structure is returned at the beginning of the response, followed by the results.

The following REST example is an empty query ("search": "*") that is scoped to the entire index (see the built-in hotels sample). The facets parameter specifies the "Category" field.

HTTP

Copy
POST https://{{service_name}}.search.windows.net/indexes/hotels/docs/search?api-version={{api_version}}
{
    "search": "*",
    "queryType": "simple",
    "select": "",
    "searchFields": "",
    "filter": "",
    "facets": [ "Category"], 
    "orderby": "",
    "count": true
}
The response for the example starts with the faceted navigation structure. The structure consists of "Category" values and a count of the hotels for each one. It's followed by the rest of the search results, trimmed here to just one document for brevity. This example works well for several reasons. The number of facets for this field fall under the limit (default is 10) so all of them appear, and every hotel in the index of 50 hotels is represented in exactly one of these categories.

JSON

Copy
{
    "@odata.context": "https://demo-search-svc.search.windows.net/indexes('hotels')/$metadata#docs(*)",
    "@odata.count": 50,
    "@search.facets": {
        "Category": [
            {
                "count": 13,
                "value": "Budget"
            },
            {
                "count": 12,
                "value": "Resort and Spa"
            },
            {
                "count": 9,
                "value": "Luxury"
            },
            {
                "count": 7,
                "value": "Boutique"
            },
            {
                "count": 5,
                "value": "Suite"
            },
            {
                "count": 4,
                "value": "Extended-Stay"
            }
        ]
    },
    "value": [
        {
            "@search.score": 1.0,
            "HotelId": "1",
            "HotelName": "Stay-Kay City Hotel",
            "Description": "The hotel is ideally located on the main commercial artery of the city in the heart of New York. A few minutes away is Time's Square and the historic centre of the city, as well as other places of interest that make New York one of America's most attractive and cosmopolitan cities.",
            "Category": "Boutique",
            "Tags": [
                "pool",
                "air conditioning",
                "concierge"
            ],
            "ParkingIncluded": false,
        },
        . . . 
    ]
}
Enable facets on fields
You can add facets to new fields that contain plain text or numeric content. Supported data types include strings, dates, boolean fields, and numeric fields (but not vectors).

You can use the Azure portal, REST APIs, Azure SDKs or any method that supports the creation or update of index schemas in Azure AI Search. As a first step, identify which fields to use for faceting.

Choose which fields to attribute
Facets can be calculated over single-value fields and collections. Fields that work best in faceted navigation have these characteristics:

Human readable (nonvector) content.
Low cardinality (a few distinct values that repeat throughout documents in your search corpus).
Short descriptive values (one or two words) that render nicely in a navigation tree.
The values within a field, and not the field name itself, produce the facets in a faceted navigation structure. If the facet is a string field named Color, facets are blue, green, and any other value for that field. Review field values to ensure there are no typos, nulls, or casing differences. Consider assigning a normalizer to a filterable and facetable field to smooth out minor variations in the text. For example, "Canada", "CANADA", and "canada" would all be normalized to one bucket.

Avoid unsupported fields
You can't set facets on existing fields, on vector fields, or fields of type Edm.GeographyPoint or Collection(Edm.GeographyPoint).

On complex field collections, "facetable" must be null.

Start with new field definitions
Attributes that affect how a field is indexed can only be set when fields are created. This restriction applies to facets and filters.

If your index already exists, you can add a new field definition that provides facets. Existing documents in the index get a null value for the new field. This null value is replaced the next time you refresh the index.

Azure portal
REST
Azure SDKs
In the search services page of the Azure portal, go to the Fields tab of the index and select Add field.

Provide a name, data type, and attributes. We recommend adding filterable because it's common to set filters based on a facet bucket in the response. We recommend sortable because filters produce unordered results, and you might want to sort them in your application.

You can also set searchable if you also want to support full text search on the field, and retrievable if you want to include the field in the search response.

Screenshot of the Add fields page in the Azure portal.

Save the field definition.

Return facets in a query
Recall that facets are dynamically calculated from results in a query response. You only get facets for documents found by the current query.

Azure portal
REST
Use JSON view in Search Explorer to set facet parameters in the Azure portal.

Select an index and open Search Explorer in JSON View.
Provide a query in JSON. You can type it out, copy the JSON from a REST example, or use intellisense to help with syntax. Refer to the REST example in the next tab for reference on facet expressions.
Select Search to return faceted results, articulated in JSON.
Here's a screenshot of the basic facet query example on the hotels sample index. You can paste in other examples in this article to return the results in Search Explorer.

Screenshot of the Search Explorer page in the Azure portal.

Best practices for working with facets
This section is a collection of tips and workarounds that are helpful for application development.

We recommend the C#: Add search to web apps for an example of faceted navigation that includes code for the presentation layer. The sample also includes filters, suggestions, and autocomplete. It uses JavaScript and React for the presentation layer.

Initialize a faceted navigation structure with an unqualified or empty search string
It's useful to initialize a search page with an open query ("search": "*") to completely fill in the faceted navigation structure. As soon as you pass query terms in the request, the faceted navigation structure is scoped to just the matches in the results, rather than the entire index. This practice is helpful for verifying facet and filter behaviors during testing. If you include match criteria in the query, the response excludes documents that don't match, which has the potential downstream effect of excluding facets.

Clear facets
When you design the user experience, remember to add a mechanism for clearing facets. A common approach for clearing facets is issuing an open query to reset the page.

Disable faceting to save on storage and improve performance
For performance and storage optimization, set "facetable": false for fields that should never be used as a facet. Examples include string fields for unique values, such as an ID or product name, to prevent their accidental (and ineffective) use in faceted navigation. This best practice is especially important for the REST API, which enables filters and facets on string fields by default.

Remember that you can't use Edm.GeographyPoint or Collection(Edm.GeographyPoint) fields in faceted navigation. Recall that facets work best on fields with low cardinality. Due to how geo-coordinates resolve, it's rare that any two sets of coordinates are equal in a given dataset. As such, facets aren't supported for geo-coordinates. You should use a city or region field to facet by location.

Check for bad data
As you prepare data for indexing, check fields for null values, misspellings or case discrepancies, and single and plural versions of the same word. By default, filters and facets don't undergo lexical analysis or spell check, which means that all values of a "facetable" field are potential facets, even if the words differ by one character.

Normalizers can mitigate data discrepancies, correcting for casing and character differences. Otherwise, to inspect your data, you can check fields at their source, or run queries that return values from the index.

An index isn't the best place to fix nulls or invalid values. You should fix data problems in your source, assuming it's a database or persistent storage, or in a data cleansing step that you perform prior to indexing.

Ordering facet buckets
Although you can sort within a bucket, there's no parameters for controlling the order of facet buckets in the navigation structure as a whole. If you want facet buckets in a specific order, you must provide it in application code.

Discrepancies in facet counts
Under certain circumstances, you might find that facet counts aren't fully accurate due to the sharding architecture. Every search index is spread across multiple shards, and each shard reports the top N facets by document count, which are then combined into a single result. Because it's just the top N facets for each shard, it's possible to miss or under-count matching documents in the facet response.

To guarantee accuracy, you can artificially inflate the count:<number> to a large number to force full reporting from each shard. You can specify "count": "0" for unlimited facets. Or, you can set "count" to a value that's greater than or equal to the number of unique values of the faceted field. For example, if you're faceting by a "size" field that has five unique values, you could set "count:5" to ensure all matches are represented in the facet response.

The tradeoff with this workaround is increased query latency, so use it only when necessary.

Preserve a facet navigation structure asynchronously of filtered results
In Azure AI Search, facets exist for current results only. However, it's a common application requirement to retain a static set of facets so that the user can navigate in reverse, retracing steps to explore alternative paths through search content.

If you want a static set of facets alongside a dynamic drilldown experience, you can implement it by using two filtered queries: one scoped to the results, the other used to create a static list of facets for navigation purposes.

Offset large facet counts through filters
Search results and facet results that are too large can be trimmed by adding filters. In the following example, in the query for cloud computing, 254 items have internal specification as a content type. If results are too large, adding filters can help your users refine the query by adding more criteria.

Items aren't mutually exclusive. If an item meets the criteria of both filters, it's counted in each one. This duplication is possible when faceting on Collection(Edm.String) fields, which are often used to implement document tagging.

Output

Copy
Search term: "cloud computing"
Content type
   Internal specification (254)
   Video (10)

Faceted navigation examples
04/09/2025
This section extends faceted navigation configuration with examples that demonstrate basic usage and other scenarios.

Facetable fields are defined in an index, but facet parameters and expressions are defined in query requests. If you have an index with facetable fields, you can try new preview features like facet hierarchies, facet aggregations, and facet filters on existing indexes.

Facet parameters and syntax
Depending on the API, a facet query is usually an array of facet expressions that are applied to search results. Each facet expression contains a facetable field name, optionally followed by a comma-separated list of name-value pairs.

facet query is a query request that includes a facet property.
facetable field is a field definition in the search index attributed with the facetable property.
count is the number of matches for each facet found in the search results.
The following table describes facet parameters used in the examples.

Facet parameter	Description	Usage	Example
count	Maximum number of facet terms per structure.	Integer. Default is 10. There's no upper limit, but higher values degrade performance, especially if the faceted field contains a large number of unique terms. This is due to the way facet queries are distributed across shards. You can set count to zero or to a value that's greater than or equal to the number of unique values in the facetable field to get an accurate count across all shards. The tradeoff is increased latency.	Tags,count:5 limits the faceted navigation response to 5 facet buckets that containing the most facet counts, but they can be in any order.
sort	Determines order of facet buckets.	Valid values are count, -count, value, -value. Use count to list facets from greatest to smallest. Use -count to sort in ascending order (smallest to greatest). Use value to sort alphanumerically by facet value in ascending order. Use -value to sort descending by value.	"facet=Category,count:3,sort:count" gets the top three facet buckets in search results, listed in descending order by the number of matches in each Category. If the top three categories are Budget, Extended-Stay, and Luxury, and Budget has 5 hits, Extended-Stay has 6, and Luxury has 4, then the facet buckets are ordered as Extended-Stay, Budget, Luxury. Another example is"facet=Rating,sort:-value". It produces facets for all possible ratings, in descending order by value. If ratings are from 1 to 5, the facets are ordered 5, 4, 3, 2, 1, irrespective of how many documents match each rating.
values	Provides values for facet labels.	Set to pipe-delimited numeric or Edm.DateTimeOffset values specifying a dynamic set of facet entry values. The values must be listed in sequential, ascending order to get the expected results.	"facet=baseRate,values:10 | 20" produces three facet buckets: one for base rate 0 up to but not including 10, one for 10 up to but not including 20, and one for 20 and higher. A string "facet=lastRenovationDate,values:2024-02-01T00:00:00Z" produces two facet buckets: one for hotels renovated before February 2024, and one for hotels renovated February 1, 2024 or later.
interval	Provides an interval sequence for facets that can be grouped into intervals.	An integer interval greater than zero for numbers, or minute, hour, day, week, month, quarter, year for date time values.	"facet=baseRate,interval:100" produces facet buckets based on base rate ranges of size 100. If base rates are all between $60 and $600, there are facet buckets for 0-100, 100-200, 200-300, 300-400, 400-500, and 500-600. The string "facet=lastRenovationDate,interval:year" produces one facet bucket for each year a hotel was renovated.
timeoffset	Specifies the UTC time offset to account for in setting time boundaries.	Set to ([+-]hh:mm, [+-]hhmm, or [+-]hh). If used, the timeoffset parameter must be combined with the interval option, and only when applied to a field of type Edm.DateTimeOffset.	"facet=lastRenovationDate,interval:day,timeoffset:-01:00" uses the day boundary that starts at 01:00:00 UTC (midnight in the target time zone).
count and sort can be combined in the same facet specification, but they can't be combined with interval or values.

interval and values can't be combined together.

Interval facets on date time are computed based on the UTC time if timeoffset isn't specified. For example, for "facet=lastRenovationDate,interval:day", the day boundary starts at 00:00:00 UTC.

Basic facet example
The following facet queries work against the hotels sample index. You can use JSON view in Search Explorer to paste in the JSON query. For help with getting started, see Add faceted navigation to search results.

This first query retrieves facets for Categories, Ratings, Tags, and rooms with baseRate values in specific ranges. Notice the last facet is on a subfield of the Rooms collection. Facets count the parent document (Hotels) and not intermediate subdocuments (Rooms), so the response determines the number of hotels that have any rooms in each pricing category.

rest

Copy
POST /indexes/hotels-sample-index/docs/search?api-version=2025-03-01-Preview
{  
  "search": "ocean view",  
  "facets": [ "Category", "Rating", "Tags", "Rooms/BaseRate,values:80|150|220" ],
  "count": true 
}  
This second example uses a filter to narrow down the previous faceted query result after the user selects Rating 3 and category "Motel".

rest

Copy
POST /indexes/hotels-sample-index/docs/search?api-version=2025-03-01-Preview
{  
  "search": "water view",  
  "facets": [ "Tags", "Rooms/BaseRate,values:80|150|220" ],
  "filter": "Rating eq 3 and Category eq 'Motel'",
  "count": true  
} 
The third example sets an upper limit on unique terms returned in a query. The default is 10, but you can increase or decrease this value using the count parameter on the facet attribute. This example returns facets for city, limited to 5.

rest

Copy
POST /indexes/hotels-sample-index/docs/search?api-version=2025-03-01-Preview
{  
  "search": "view",  
  "facets": [ "Address/City,count:5" ],
  "count": true
} 
This example shows three facets for "Category", "Tags", and "Rating", with a count override on "Tags" and a range override for "Rating", which is otherwise stored as a double in the index.

HTTP

Copy
POST https://{{service_name}}.search.windows.net/indexes/hotels/docs/search?api-version={{api_version}}
{
    "search": "*",
    "facets": [ 
        "Category", 
        "Tags,count:5", 
        "Rating,values:1|2|3|4|5"
    ],
    "count": true
}
For each faceted navigation tree, there's a default limit of the top 10 facet instances found by the query. This default makes sense for navigation structures because it keeps the values list to a manageable size. You can override the default by assigning a value to "count". For example, "Tags,count:5" reduces the number of tags under the Tags section to the top five.

For Numeric and DateTime values only, you can explicitly set values on the facet field (for example, facet=Rating,values:1|2|3|4|5) to separate results into contiguous ranges (either ranges based on numeric values or time periods). Alternatively, you can add "interval", as in facet=Rating,interval:1.

Each range is built using 0 as a starting point, a value from the list as an endpoint, and then trimmed of the previous range to create discrete intervals.

Distinct values example
You can formulate a query that returns a distinct value count for each facetable field. This example formulates an empty or unqualified query ("search": "*") that matches on all documents, but by setting top to zero, you get just the counts, with no results.

For brevity, this query includes just two fields marked as facetable in the hotels sample index.

HTTP

Copy
POST https://{{service_name}}.search.windows.net/indexes/hotels/docs/search?api-version={{api_version}}
{
    "search": "*",
    "count": true,
    "top": 0,
    "facets": [ 
        "Category", "Address/StateProvince""
    ]
}
Results from this query are as follows:

JSON

Copy
{
  "@odata.count": 50,
  "@search.facets": {
    "Address/StateProvince": [
      {
        "count": 9,
        "value": "WA"
      },
      {
        "count": 6,
        "value": "CA "
      },
      {
        "count": 4,
        "value": "FL"
      },
      {
        "count": 3,
        "value": "NY"
      },
      {
        "count": 3,
        "value": "OR"
      },
      {
        "count": 3,
        "value": "TX"
      },
      {
        "count": 2,
        "value": "GA"
      },
      {
        "count": 2,
        "value": "MA"
      },
      {
        "count": 2,
        "value": "TN"
      },
      {
        "count": 1,
        "value": "AZ"
      }
    ],
    "Category": [
      {
        "count": 13,
        "value": "Budget"
      },
      {
        "count": 12,
        "value": "Suite"
      },
      {
        "count": 7,
        "value": "Boutique"
      },
      {
        "count": 7,
        "value": "Resort and Spa"
      },
      {
        "count": 6,
        "value": "Extended-Stay"
      },
      {
        "count": 5,
        "value": "Luxury"
      }
    ]
  },
  "value": []
}
Facet hierarchy example
 Note

This feature is currently in public preview. This preview is provided without a service-level agreement and isn't recommended for production workloads. Certain features might not be supported or might have constrained capabilities. For more information, see Supplemental Terms of Use for Microsoft Azure Previews.

Starting in 2025-03-01-preview REST API and available in the Azure portal, you can configure a facet hierarchy using the > and ; operators.

Operator	Description
>	Nesting (hierarchical) operator denotes a parent–child relationship.
;	Semicolon operator denotes multiple fields at the same nesting level, which are all children of the same parent. The parent must contain only one field. Both the parent and child fields must be facetable.
The order of operations in a facet expression that includes facet hierarchies are:

The options operator (comma ,) that separates facet parameters for the facet field, such as the comma in Rooms/BaseRate,values
The parentheses, such as the ones enclosing (Rooms/BaseRate,values:50 ; Rooms/Type).
The nesting operator (angled bracket >)
The append operator (semicolon ;), demonstrated in a second example "Tags>(Rooms/BaseRate,values:50 ; Rooms/Type)" in this section, where two child facets are peers under the Tags parent.
Notice that parentheses are processed before nesting and append operations: A > B ; C would be different than A > (B ; C).

There are several examples for facet hierarchies. The first example is a query that returns just a few documents, which is helpful for viewing a full response. Facets count the parent document (Hotels) and not intermediate subdocuments (Rooms), so the response determines the number of hotels that have any rooms in each facet bucket.

rest

Copy
POST /indexes/hotels-sample-index/docs/search?api-version=2025-03-01-Preview
{
  "search": "ocean",  
  "facets": ["Address/StateProvince>Address/City", "Tags>Rooms/BaseRate,values:50"],
  "select": "HotelName, Description, Tags, Address/StateProvince, Address/City",
  "count": true 
}
Results from this query are as follows. Both hotels have pools. For other tags, only one hotel provides the amenity.

JSON

Copy
{
  "@odata.count": 2,
  "@search.facets": {
    "Tags": [
      {
        "value": "pool",
        "count": 2,
        "@search.facets": {
          "Rooms/BaseRate": [
            {
              "to": 50,
              "count": 0
            },
            {
              "from": 50,
              "count": 2
            }
          ]
        }
      },
      {
        "value": "air conditioning",
        "count": 1,
        "@search.facets": {
          "Rooms/BaseRate": [
            {
              "to": 50,
              "count": 0
            },
            {
              "from": 50,
              "count": 1
            }
          ]
        }
      },
      {
        "value": "bar",
        "count": 1,
        "@search.facets": {
          "Rooms/BaseRate": [
            {
              "to": 50,
              "count": 0
            },
            {
              "from": 50,
              "count": 1
            }
          ]
        }
      },
      {
        "value": "restaurant",
        "count": 1,
        "@search.facets": {
          "Rooms/BaseRate": [
            {
              "to": 50,
              "count": 0
            },
            {
              "from": 50,
              "count": 1
            }
          ]
        }
      },
      {
        "value": "view",
        "count": 1,
        "@search.facets": {
          "Rooms/BaseRate": [
            {
              "to": 50,
              "count": 0
            },
            {
              "from": 50,
              "count": 1
            }
          ]
        }
      }
    ],
    "Address/StateProvince": [
      {
        "value": "FL",
        "count": 1,
        "@search.facets": {
          "Address/City": [
            {
              "value": "Tampa",
              "count": 1
            }
          ]
        }
      },
      {
        "value": "HI",
        "count": 1,
        "@search.facets": {
          "Address/City": [
            {
              "value": "Honolulu",
              "count": 1
            }
          ]
        }
      }
    ]
  },
  "value": [
    {
      "@search.score": 1.6076145,
      "HotelName": "Ocean Water Resort & Spa",
      "Description": "New Luxury Hotel for the vacation of a lifetime. Bay views from every room, location near the pier, rooftop pool, waterfront dining & more.",
      "Tags": [
        "view",
        "pool",
        "restaurant"
      ],
      "Address": {
        "City": "Tampa",
        "StateProvince": "FL"
      }
    },
    {
      "@search.score": 1.0594962,
      "HotelName": "Windy Ocean Motel",
      "Description": "Oceanfront hotel overlooking the beach features rooms with a private balcony and 2 indoor and outdoor pools. Inspired by the natural beauty of the island, each room includes an original painting of local scenes by the owner. Rooms include a mini fridge, Keurig coffee maker, and flatscreen TV. Various shops and art entertainment are on the boardwalk, just steps away.",
      "Tags": [
        "pool",
        "air conditioning",
        "bar"
      ],
      "Address": {
        "City": "Honolulu",
        "StateProvince": "HI"
      }
    }
  ]
}
This second example extends the previous one, demonstrating multiple top-level facets with multiple children. Notice the semicolon (;) operator separates each child.

rest

Copy
POST /indexes/hotels-sample-index/docs/search?api-version=2025-03-01-Preview
{  
  "search": "+ocean",  
  "facets": ["Address/StateProvince > Address/City", "Tags > (Rooms/BaseRate,values:50 ; Rooms/Type)"],
  "select": "HotelName, Description, Tags, Address/StateProvince, Address/City",
  "count": true 
}  
A partial response, trimmed for brevity, shows Tags with child facets for the rooms base rate and type. In the hotels sample index, both hotels that match to +ocean have rooms in each type and a pool.

JSON

Copy
{
  "@odata.count": 2,
  "@search.facets": {
    "Tags": [
      {
        "value": "pool",
        "count": 2,
        "@search.facets": {
          "Rooms/BaseRate": [
            {
              "to": 50,
              "count": 0
            },
            {
              "from": 50,
              "count": 2
            }
          ],
          "Rooms/Type": [
            {
              "value": "Budget Room",
              "count": 2
            },
            {
              "value": "Deluxe Room",
              "count": 2
            },
            {
              "value": "Standard Room",
              "count": 2
            },
            {
              "value": "Suite",
              "count": 2
            }
          ]
        }}]},
  ...
}
This last example shows precedence rules for parentheses that affects nesting levels. Suppose you want to return a facet hierarchy in this order.


Copy
Address/StateProvince
  Address/City
    Category
    Rating
To return this hierarchy, create a query where Category and Rating are siblings under Address/City.

JSON

Copy
  { 
    "search": "beach",  
    "facets": [
        "Address/StateProvince > (Address/City > (Category ; Rating))"
        ],
    "select": "HotelName, Description, Tags, Address/StateProvince, Address/City",
    "count": true 
  }
If you remove the innermost parentheses, Category and Rating are no longer siblings because the precedence rules mean that the > operator is evaluated before ;.

JSON

Copy
  { 
    "search": "beach",  
    "facets": [
        "Address/StateProvince > (Address/City > Category ; Rating)"
        ],
    "select": "HotelName, Description, Tags, Address/StateProvince, Address/City",
    "count": true 
  }
The top-level parent is still Address/StateProvince, but now Address/City and Rating are on same level.


Copy
Address/StateProvince
  Rating
  Address/City
    Category
Facet filtering example
 Note

This feature is currently in public preview. This preview is provided without a service-level agreement and isn't recommended for production workloads. Certain features might not be supported or might have constrained capabilities. For more information, see Supplemental Terms of Use for Microsoft Azure Previews.

Starting in 2025-03-01-preview REST API and available in the Azure portal, you can configure facet filters.

Facet filtering enables you to constrain the facet values returned to those matching a specified regular expression. Two new parameters accept a regular expression that is applied to the facet field:

includeTermFilter filters the facet values to those that match the regular expression
excludeTermFilter filters the facet values to those that don't match the regular expression
If a facet string satisfies both conditions, the excludeTermFilter takes precedence because the set of bucket strings is first evaluated with includeTermFilter and then excluded with excludeTermFilter.

Only those facet values that match the regular expression are returned. You can combine these parameters with other facet options (for example, count, sort, and hierarchical faceting) on string fields.

Because the regular expression is nested within a JSON string value, you must escape both the double quote (") and the backslash (\) characters. The regular expression itself is delimited by the forward slash (/). For more information about escape patterns, see Regular expression search.

The following example shows how to escape special characters in your regular expression such as backslash, double quotes, or regular expression syntax characters.

JSON

Copy
{
    "search": "*", 
    "facets": ["name,includeTermFilter:/EscapeBackslash\\\OrDoubleQuote\\"OrRegexCharacter\\(/"] 
}
Here's an example of a facet filter that matches on Budget and Extended-Stay hotels, with Rating as a child of each hotel category.

HTTP

Copy
POST /indexes/hotels-sample-index/docs/search?api-version=2025-03-01-Preview
{ 
    "search": "*", 
    "facets": ["(Category,includeTermFilter:/(Budget|Extended-Stay)/)>Rating,values:1|2|3|4|5"],
    "select": "HotelName, Category, Rating",
    "count": true 
} 
The following example is an abbreviated response (hotel documents are omitted for brevity).

JSON

Copy
{
  "@odata.count": 50,
  "@search.facets": {
    "Category": [
      {
        "value": "Budget",
        "count": 13,
        "@search.facets": {
          "Rating": [
            {
              "to": 1,
              "count": 0
            },
            {
              "from": 1,
              "to": 2,
              "count": 0
            },
            {
              "from": 2,
              "to": 3,
              "count": 4
            },
            {
              "from": 3,
              "to": 4,
              "count": 5
            },
            {
              "from": 4,
              "to": 5,
              "count": 4
            },
            {
              "from": 5,
              "count": 0
            }
          ]
        }
      },
      {
        "value": "Extended-Stay",
        "count": 6,
        "@search.facets": {
          "Rating": [
            {
              "to": 1,
              "count": 0
            },
            {
              "from": 1,
              "to": 2,
              "count": 0
            },
            {
              "from": 2,
              "to": 3,
              "count": 4
            },
            {
              "from": 3,
              "to": 4,
              "count": 1
            },
            {
              "from": 4,
              "to": 5,
              "count": 1
            },
            {
              "from": 5,
              "count": 0
            }
          ]
        }
      }
    ]
  }, 
  "value": [  ALL 50 HOTELS APPEAR HERE ]
}
Facet aggregation example
 Note

This feature is currently in public preview. This preview is provided without a service-level agreement and isn't recommended for production workloads. Certain features might not be supported or might have constrained capabilities. For more information, see Supplemental Terms of Use for Microsoft Azure Previews.

Starting in 2025-03-01-preview REST API and available in the Azure portal, you can aggregate facets.

Facet aggregations allow you to compute metrics from facet values. The aggregation capability works alongside the existing faceting options. The only supported metric is sum. Adding metric: sum to a numeric facet aggregates all the values of each bucket.

You can add a default value to use if a document contains a null for that field: "facets": [ "Rooms/SleepsCount, metric: sum, default:2"]. If a room has a null value for the Rooms/SleepsCount field, the default substitutes for the missing value.

You can sum any facetable field of a numeric data type (except vectors and geographic coordinates).

Here's an example using the hotels-sample-index. The Rooms/SleepsCount field is facetable and numeric, so we choose this field to demonstrate sum. If we sum that field, we get the sleep count for the entire hotel. Recall that facets count the parent document (Hotels) and not intermediate subdocuments (Rooms), so the response sums the SleepsCount of all rooms for the entire hotel. In this query, we add a filter to sum the SleepsCount for just one hotel.

rest

Copy
POST /indexes/hotels-sample-index/docs/search?api-version=2025-03-01-Preview

{ 
      "search": "*",
      "filter": "HotelId eq '41'",
      "facets": [ "Rooms/SleepsCount, metric: sum"],
      "select": "HotelId, HotelName, Rooms/Type, Rooms/SleepsCount",
      "count": true
}
A response for the query might look like the following example. Windy Ocean Model can accommodate a total of 40 guests.

JSON

Copy
{
  "@odata.count": 1,
  "@search.facets": {
    "Rooms/SleepsCount": [
      {
        "sum": 40.0
      }
    ]
  },
  "value": [
    {
      "@search.score": 1.0,
      "HotelId": "41",
      "HotelName": "Windy Ocean Motel",
      "Rooms": [
        {
          "Type": "Suite",
          "SleepsCount": 4
        },
        {
          "Type": "Deluxe Room",
          "SleepsCount": 2
        },
        {
          "Type": "Budget Room",
          "SleepsCount": 2
        },
        {
          "Type": "Budget Room",
          "SleepsCount": 2
        },
        {
          "Type": "Suite",
          "SleepsCount": 2
        },
        {
          "Type": "Standard Room",
          "SleepsCount": 2
        },
        {
          "Type": "Deluxe Room",
          "SleepsCount": 2
        },
        {
          "Type": "Suite",
          "SleepsCount": 2
        },
        {
          "Type": "Suite",
          "SleepsCount": 4
        },
        {
          "Type": "Standard Room",
          "SleepsCount": 4
        },
        {
          "Type": "Standard Room",
          "SleepsCount": 2
        },
        {
          "Type": "Deluxe Room",
          "SleepsCount": 2
        },
        {
          "Type": "Suite",
          "SleepsCount": 2
        },
        {
          "Type": "Standard Room",
          "SleepsCount": 2
        },
        {
          "Type": "Deluxe Room",
          "SleepsCount": 2
        },
        {
          "Type": "Deluxe Room",
          "SleepsCount": 2
        },
        {
          "Type": "Standard Room",
          "SleepsCount": 2
        }
      ]
    }
  ]
}
Next steps
Revisit facet navigation configuration for tools and APIs, and review best practices for working with facets in code.

We recommend the C#: Add search to web apps for an example of faceted navigation that includes code for the presentation layer. The sample also includes filters, suggestions, and autocomplete. It uses JavaScript and React for the presentation layer.

Text normalization for case-insensitive filtering, faceting and sorting
05/19/2025
 Important

This feature is in public preview under Supplemental Terms of Use. We recommend the latest preview REST API version for this feature.

In Azure AI Search, a normalizer is a component that pre-processes text for keyword matching over fields marked as "filterable", "facetable", or "sortable". In contrast with full text "searchable" fields that are paired with text analyzers, content that's created for filter-facet-sort operations doesn't undergo analysis or tokenization. Omission of text analysis can produce unexpected results when casing and character differences show up, which is why you need a normalizer to homogenize variations in your content.

By applying a normalizer, you can achieve light text transformations that improve results:

Consistent casing (such as all lowercase or uppercase)
Normalize accents and diacritics like ö or ê to ASCII equivalent characters "o" and "e"
Map characters like - and whitespace into a user-specified character
Benefits of normalizers
Searching and retrieving documents from a search index requires matching the query input to the contents of the document. Matching is either over tokenized content, as is the case when you invoke "search", or over non-tokenized content if the request is a filter, facet, or orderby operation.

Because non-tokenized content is also not analyzed, small differences in the content are evaluated as distinctly different values. Consider the following examples:

$filter=City eq 'Las Vegas' will only return documents that contain the exact text "Las Vegas" and exclude documents with "LAS VEGAS" and "las vegas", which is inadequate when the use-case requires all documents regardless of the casing.

search=*&facet=City,count:5 will return "Las Vegas", "LAS VEGAS" and "las vegas" as distinct values despite being the same city.

search=usa&$orderby=City will return the cities in lexicographical order: "Las Vegas", "Seattle", "las vegas", even if the intent is to order the same cities together irrespective of the case.

A normalizer, which is invoked during indexing and query execution, adds light transformations that smooth out minor differences in text for filter, facet, and sort scenarios. In the previous examples, the variants of "Las Vegas" would be processed according to the normalizer you select (for example, all text is lower-cased) for more uniform results.

How to specify a normalizer
Normalizers are specified in an index definition, on a per-field basis, on text fields (Edm.String and Collection(Edm.String)) that have at least one of "filterable", "sortable", or "facetable" properties set to true. Setting a normalizer is optional and is null by default. We recommend evaluating predefined normalizers before configuring a custom one.

Normalizers can only be specified when you add a new field to the index, so if possible, try to assess the normalization needs upfront and assign normalizers in the initial stages of development when dropping and recreating indexes is routine.

When creating a field definition in the index, set the "normalizer" property to one of the following values: a predefined normalizer such as "lowercase", or a custom normalizer (defined in the same index schema).

JSON

Copy
"fields": [
 {
   "name": "Description",
   "type": "Edm.String",
   "retrievable": true,
   "searchable": true,
   "filterable": true,
   "analyzer": "en.microsoft",
   "normalizer": "lowercase"
   ...
 }
]
Custom normalizers are defined in the "normalizers" section of the index first, and then assigned to the field definition as shown in the previous step. For more information, see Create Index and also Add custom normalizers.

JSON

Copy
"fields": [
 {
   "name": "Description",
   "type": "Edm.String",
   "retrievable": true,
   "searchable": true,
   "analyzer": null,
   "normalizer": "my_custom_normalizer"
 },
 Note

To change the normalizer of an existing field, rebuild the index entirely (you cannot rebuild individual fields).

A good workaround for production indexes, where rebuilding indexes is costly, is to create a new field identical to the old one but with the new normalizer, and use it in place of the old one. Use Update Index to incorporate the new field and mergeOrUpload to populate it. Later, as part of planned index servicing, you can clean up the index to remove obsolete fields.

Predefined and custom normalizers
Azure AI Search provides built-in normalizers for common use-cases along with the capability to customize as required.

Category	Description
Predefined normalizers	Provided out-of-the-box and can be used without any configuration.
Custom normalizers 1	For advanced scenarios. Requires user-defined configuration of a combination of existing elements, consisting of char and token filters.
(1) Custom normalizers don't specify tokenizers since normalizers always produce a single token.

Normalizers reference
Predefined normalizers
Name	Description and Options
standard	Lowercases the text followed by asciifolding.
lowercase	Transforms characters to lowercase.
uppercase	Transforms characters to uppercase.
asciifolding	Transforms characters that aren't in the Basic Latin Unicode block to their ASCII equivalent, if one exists. For example, changing à to a.
elision	Removes elision from beginning of the tokens.
Supported char filters
Normalizers support two character filters that are identical to their counterparts in custom analyzer character filters:

mapping
pattern_replace
Supported token filters
The list below shows the token filters supported for normalizers and is a subset of the overall token filters used in custom analyzers.

arabic_normalization
asciifolding
cjk_width
elision
german_normalization
hindi_normalization
indic_normalization
persian_normalization
scandinavian_normalization
scandinavian_folding
sorani_normalization
lowercase
uppercase
Add custom normalizers
Custom normalizers are defined within the index schema. The definition includes a name, a type, one or more character filters and token filters. The character filters and token filters are the building blocks for a custom normalizer and responsible for the processing of the text. These filters are applied from left to right.

The token_filter_name_1 is the name of token filter, and char_filter_name_1 and char_filter_name_2 are the names of char filters (see supported token filters and supported char filterstables below for valid values).

JSON

Copy
"normalizers":(optional)[
   {
      "name":"name of normalizer",
      "@odata.type":"#Microsoft.Azure.Search.CustomNormalizer",
      "charFilters":[
         "char_filter_name_1",
         "char_filter_name_2"
      ],
      "tokenFilters":[
         "token_filter_name_1"
      ]
   }
],
"charFilters":(optional)[
   {
      "name":"char_filter_name_1",
      "@odata.type":"#char_filter_type",
      "option1": "value1",
      "option2": "value2",
      ...
   }
],
"tokenFilters":(optional)[
   {
      "name":"token_filter_name_1",
      "@odata.type":"#token_filter_type",
      "option1": "value1",
      "option2": "value2",
      ...
   }
]
Custom normalizers can be added during index creation or later by updating an existing one. Adding a custom normalizer to an existing index requires the "allowIndexDowntime" flag to be specified in Update Index and will cause the index to be unavailable for a few seconds.

Custom normalizer example
The example below illustrates a custom normalizer definition with corresponding character filters and token filters. Custom options for character filters and token filters are specified separately as named constructs, and then referenced in the normalizer definition as illustrated below.

A custom normalizer named "my_custom_normalizer" is defined in the "normalizers" section of the index definition.

The normalizer is composed of two character filters and three token filters: elision, lowercase, and customized asciifolding filter "my_asciifolding".

The first character filter "map_dash" replaces all dashes with underscores while the second one "remove_whitespace" removes all spaces.

JSON

Copy
  {
     "name":"myindex",
     "fields":[
        {
           "name":"id",
           "type":"Edm.String",
           "key":true,
           "searchable":false,
        },
        {
           "name":"city",
           "type":"Edm.String",
           "filterable": true,
           "facetable": true,
           "normalizer": "my_custom_normalizer"
        }
     ],
     "normalizers":[
        {
           "name":"my_custom_normalizer",
           "@odata.type":"#Microsoft.Azure.Search.CustomNormalizer",
           "charFilters":[
              "map_dash",
              "remove_whitespace"
           ],
           "tokenFilters":[              
              "my_asciifolding",
              "elision",
              "lowercase",
           ]
        }
     ],
     "charFilters":[
        {
           "name":"map_dash",
           "@odata.type":"#Microsoft.Azure.Search.MappingCharFilter",
           "mappings":["-=>_"]
        },
        {
           "name":"remove_whitespace",
           "@odata.type":"#Microsoft.Azure.Search.MappingCharFilter",
           "mappings":["\\u0020=>"]
        }
     ],
     "tokenFilters":[
        {
           "name":"my_asciifolding",
           "@odata.type":"#Microsoft.Azure.Search.AsciiFoldingTokenFilter",
           "preserveOriginal":true
        }
     ]
  }
  Create a full text query in Azure AI Search
04/14/2025
If you're building a query for full text search, this article provides steps for setting up the request. It also introduces a query structure, and explains how field attributes and linguistic analyzers can affect query outcomes.

Prerequisites
A search index with string fields attributed as searchable.

Read permissions on the search index. For read access, include a query API key on the request, or give the caller Search Index Data Reader permissions.

Example of a full text query request
In Azure AI Search, a query is a read-only request against the docs collection of a single search index, with parameters that both inform query execution and shape the response coming back.

A full text query is specified in a search parameter and consists of terms, quote-enclosed phrases, and operators. Other parameters add more definition to the request.

The following Search POST REST API call illustrates a query request using search and other parameters.

HTTP

Copy
POST https://[service name].search.windows.net/indexes/hotels-sample-index/docs/search?api-version=2024-07-01
{
    "search": "NY +view",
    "queryType": "simple",
    "searchMode": "all",
    "searchFields": "HotelName, Description, Address/City, Address/StateProvince, Tags",
    "select": "HotelName, Description, Address/City, Address/StateProvince, Tags",
    "top": 10,
    "count": true
}
Key points
search provides the match criteria, usually whole terms or phrases, with or without operators. Any field that is attributed as searchable in the index schema is within scope for a search operation.

queryType sets the parser: simple, full. The default simple query parser is optimal for full text search. The full Lucene query parser is for advanced query constructs like regular expressions, proximity search, fuzzy and wildcard search. This parameter can also be set to semantic for semantic ranking for advanced semantic modeling on the query response.

searchMode specifies whether matches are based on all criteria (favors precision) or any criteria (favors recall) in the expression. The default is any. If you anticipate heavy use of Boolean operators, which is more likely in indexes that contain large text blocks (a content field or long descriptions), be sure to test queries with the searchMode=Any|All parameter to evaluate the impact of that setting on Boolean search.

searchFields constrains query execution to specific searchable fields. During development, it's helpful to use the same field list for select and search. Otherwise a match might be based on field values that you can't see in the results, creating uncertainty as to why the document was returned.

Parameters used to shape the response:

select specifies which fields to return in the response. Only fields marked as retrievable in the index can be used in a select statement.

top returns the specified number of best-matching documents. In this example, only 10 hits are returned. You can use top and skip (not shown) to page the results.

count tells you how many documents in the entire index match overall, which can be more than what are returned.

orderby is used if you want to sort results by a value, such as a rating or location. Otherwise, the default is to use the relevance score to rank results. A field must be attributed as sortable to be a candidate for this parameter.

Choose a client
For early development and proof-of-concept testing, start with the Azure portal or a REST client or a Jupyter notebook. These approaches are interactive, useful for targeted testing, and help you assess the effects of different properties without having to write any code.

To call search from within an app, use the Azure.Document.Search client libraries in the Azure SDKs for .NET, Java, JavaScript, and Python.

Azure portal
REST API
Azure SDKs
In the Azure portal, when you open an index, you can work with Search Explorer alongside the index JSON definition in side-by-side tabs for easy access to field attributes. Check the Fields table to see which ones are searchable, sortable, filterable, and facetable while testing queries.

Sign in to the Azure portal and find your search service.

In your service, select Indexes and choose an index.

An index opens to the Search explorer tab so that you can query right away. Switch to JSON view to specify query syntax.

Here's a full text search query expression that works for the Hotels sample index:

JSON

Copy
   {
       "search": "pool spa +airport",
       "queryType": "simple",
       "searchMode": "any",
       "searchFields": "Description, Tags",
       "select": "HotelName, Description, Tags",
       "top": 10,
       "count": true
   }
The following screenshot illustrates the query and response:

Screenshot of Search Explorer with a full text query.

Choose a query type: simple | full
If your query is full text search, a query parser is used to process any text that's passed as search terms and phrases. Azure AI Search offers two query parsers.

The simple parser understands the simple query syntax. This parser was selected as the default for its speed and effectiveness in free form text queries. The syntax supports common search operators (AND, OR, NOT) for term and phrase searches, and prefix (*) search (as in sea* for Seattle and Seaside). A general recommendation is to try the simple parser first, and then move on to full parser if application requirements call for more powerful queries.

The full Lucene query syntax, enabled when you add queryType=full to the request, is based on the Apache Lucene Parser.

Full syntax and simple syntax overlap to the extent that both support the same prefix and Boolean operations, but the full syntax provides more operators. In full, there are more operators for Boolean expressions, and more operators for advanced queries such as fuzzy search, wildcard search, proximity search, and regular expressions.

Choose query methods
Search is fundamentally a user-driven exercise, where terms or phrases are collected from a search box, or from click events on a page. The following table summarizes the mechanisms by which you can collect user input, along with the expected search experience.

Input	Experience
Search method	A user types the terms or phrases into a search box, with or without operators, and selects Search to send the request. Search can be used with filters on the same request, but not with autocomplete or suggestions.
Autocomplete method	A user types a few characters, and queries are initiated after each new character is typed. The response is a completed string from the index. If the string provided is valid, the user selects Search to send that query to the service.
Suggestions method	As with autocomplete, a user types a few characters and incremental queries are generated. The response is a dropdown list of matching documents, typically represented by a few unique or descriptive fields. If any of the selections are valid, the user selects one and the matching document is returned.
Faceted navigation	A page shows clickable navigation links or breadcrumbs that narrow the scope of the search. A faceted navigation structure is composed dynamically based on an initial query. For example, search=* to populate a faceted navigation tree composed of every possible category. A faceted navigation structure is created from a query response, but it's also a mechanism for expressing the next query. n REST API reference, facets is documented as a query parameter of a Search Documents operation, but it can be used without the search parameter.
Filter method	Filters are used with facets to narrow results. You can also implement a filter behind the page, for example to initialize the page with language-specific fields. In REST API reference, $filter is documented as a query parameter of a Search Documents operation, but it can be used without the search parameter.
Effect of field attributes on queries
If you're familiar with query types and composition, you might remember that the parameters on a query request depend on field attributes in an index. For example, only fields marked as searchable and retrievable can be used in queries and search results. When setting the search, filter, and orderby parameters in your request, you should check attributes to avoid unexpected results.

In the following screenshot of the hotels sample index, only the last two fields LastRenovationDate and Rating are sortable, a requirement for use in an "$orderby" only clause.

Screenshot that shows the index definition for the hotel sample.

For field attribute definitions, see Create Index (REST API).

Effect of tokens on queries
During indexing, the search engine uses a text analyzer on strings to maximize the potential for finding a match at query time. At a minimum, strings are lower-cased, but depending on the analyzer, might also undergo lemmatization and stop word removal. Larger strings or compound words are typically broken up by whitespace, hyphens, or dashes, and indexed as separate tokens.

The key point is that what you think your index contains, and what's actually in it, can be different. If queries don't return expected results, you can inspect the tokens created by the analyzer through the Analyze Text (REST API). For more information about tokenization and the effect on queries, see Partial term search and patterns with special characters.

Related content
Now that you have a better understanding of how query requests work, try the following quickstarts for hands-on experience.