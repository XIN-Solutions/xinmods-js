# XIN Mods JS

A package that interfaces with REST endpoints found in Bloomreach Hippo CMS with XIN Mods
installed on top. 

## How to use

Use the library simply by including it into your `package.json`.

To connect to your Hippo REST layer create a `HippoConnection` object like this, simply
input the correct URL at which the tomcat context lives, and a user that is either `admin`
or member of the `restuser` group:

    const xinmods = require('xinmods');
    const hippo = xinmods.connectTo('http://localhost:8080', 'admin', 'admin');
        
The `HippoConnection` object has a number of useful functions:

* `getDocumentByUuid(uuid)`; get the document at UUID 
* `listDocuments(path)`; list documents and folders at a certain path
* `uuidToPath(uuid)`; convert a UUID to a JCR path
* `pathToUuid(path)`; convert a path to a UUID
* `getDocumentByPath(path)`; does two things, convert from path to uuid, and then get the document
* `sanitiseDocument(doc)`; removes the namespace notations from all keys in the object
* `getDocuments(options)`; a rudimentary way to query for nodes in the JCR.

Find their usages below:
    
    // get a document by its UUID
	const doc = await hippo.getDocumentByUuid("c0c9833c-144a-40a1-a5ba-2fd49aeebe98");
	console.log("Retrieved a document:", doc);

    // get a list of folder and documents (one level deep) at a particular path 
	const list = await hippo.listDocuments("/content/documents/site/articles");
	console.log("Retrieved a folder:", list);

    // convert a uuid to its path in the Hippo CMS
	const {path} = await hippo.uuidToPath("c0c9833c-144a-40a1-a5ba-2fd49aeebe98");
	console.log("Path for uuid: ", path);

    // convert a path to uuid
	const {uuid} = await hippo.pathToUuid(path);
	console.log("Uuid: ", uuid);

    // get a document that lives at a certain path
    // calls the hippo default /site/api/documents/{uuid} (based on the path) endpoint
	const docByPath = await hippo.getDocumentByPath(path);
	console.log("Doc:", docByPath);
	
	// this will get rid of all the namespace names in documents
	const sanitisedDoc = hippo.sanitiseDocument(docByPath);

    // calls the hippo default /site/api/documents endpoint
	const docs = await hippo.getDocuments({
        offset: 0,
        max: 10,
        
        nodeType: "test:article",
        
        // optional (retrieves only information about certain attributes)
        attributes: ['test:title', 'test:description'],
        
        query: "mark",
        
        // these two can be arrays as well (['test:fieldname', '...'] and ['asc', 'desc', ..])
        orderBy: "test:fieldname",
        sortOrder: "asc|desc"
	});


More complicated queries can be done by communicating with the XIN Mods-specific `/query/` endpoint.
There is a `QueryBuilder` that can build the query string using a fluid notation. 

A complicated query looks like this:

	const queryString =
		hippo.newQuery()
			.type('test:article').withSubtypes()
			.includePath("/content/documents/site/articles")
			.includePath('/content/anotherpath')
			.excludePath('/content/exclude/this/path')
			.where()
			    // .or() also works
			    .and()
			        .eq("test:myfield", "a value")
			        .and()
			            .gte("test:price", 10)
			            .lte("test:price", 100)
                    .end() 
			    .end()
			.end()
			.orderBy('test:title', 'asc|desc')
			.offset(0)
			.limit(10)
		.build()
	;
	
	console.log("QUERY:\n", queryString);
	
	const qResult =
		await hippo.executeQuery(queryString, {
		    // set to true if you want to keep the namespace in the results
			namespace: true,
			
			// if set to false, it will only get a small list of uuids
			// if set to true it will also grab the document content
			documents: true
		});
	
	console.log("RESULT: ", qResult);
	

## XIN Mods
  
A headless CMS, Content as a Service (CaaS) solution for Bloomreach Hippo.

The XIN mods are a set of tools that turn a vanilla Bloomreach Hippo CMS install into an 
easy-to-deploy and throw-away Content as a Service instance that you can use to 
quickly model and query information in your repository with!

It includes the following:

* A more compact authoring experience.
* Package management - move your content between servers.
* Multi-tenanted Document REST API to query and retrieve the documents you need.
* Admin panels and custom iframe panels for integrations with other systems you use.
* Finally integrating the CMS events with your other microservices.
* All the great things you know from Hippo CMS.

### The bigger picture

What XIN Mods provides is a mature CMS platform (Hippo CMS) adjusted to be more in 
tune with whatever frontend technology you might be using to interface with your 
users. It does this by implementing a functionally rich CaaS layer on top of 
the excellent Hippo CMS APIs.

XIN Mods makes it so that your CMS isn't the center of the universe, instead it will 
simply a cog in a larger machine.

Powerful REST APIs extensions connect you to the CMS in an easy to understand way.

In short, the XIN Mods let Bloomreach's Hippo CMS fit into the bigger picture of organisations
that already have a wealth of infrastructure without requiring the entire ecosystem to 
bend to its needs.

### Read More

[Read more about XIN Mods here](https://xinsolutions.co.nz/bloomreach-hippo-cms-caas). 
