# XIN Mods JS

A package that interfaces with REST endpoints found in Bloomreach Hippo CMS with 
[XIN Mods](https://xinsolutions.co.nz/bloomreach-hippo-cms-caas) installed on top. 

## How to use

Use the library simply by including it into your `package.json`.

To connect to your Hippo REST layer create a `HippoConnection` object like this, simply
input the correct URL at which the tomcat context lives, and a user that is either `admin`
or member of the `restuser` group:

    const xinmods = require('xinmods');
    
    // you don't have to specify these as they are the default values.
    // when you deploy to a proper instance you probably want to change these values.
    const options = {
        hippoApi: '/site/api',
        xinApi: '/site/custom-api',
        assetPath: '/site/binaries',
        assetModPath: '/site/assetmod',
        
        caching: true|false,
    };
       
    const hippo = xinmods.connectTo('http://localhost:8080', 'admin', 'admin', options);
        
If caching is enabled the cache layer relies on the following environment variables to change its behaviour:

* `CACHE_TTL`; ttl in seconds
* `CACHE_DEBUG`; show state of cache when hit/stored.
        
The `HippoConnection` object has a number of useful functions:

* `getDocumentByUuid(uuid)`; get the document at UUID 
* `listDocuments(path)`; list documents and folders at a certain path
* `uuidToPath(uuid)`; convert a UUID to a JCR path
* `pathToUuid(path)`; convert a path to a UUID
* `getDocumentByPath(path)`; does two things, convert from path to uuid, and then get the document
* `getDocuments(options)`; a rudimentary way to query for nodes in the JCR.
* `sanitiseDocument(doc)`; removes the namespace notations from all keys in the object

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
                    .equals("test:myfield", "a value")
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
	
Operators that are available:

* `.equals`, `.equalsIgnoreCase`
* `.notEquals`, `.notEqualsIgnoreCase`
* `.contains`, `.notContains`
* `.isNull`, `.isNotNull`
* `.gt` (greater than)
* `.gte` (greater than or equal to)
* `.lt` (lower than)
* `.lte` (lower than or equal to)
* `.and()`, `.or()` compound operators

### Asset Mods

Hippo CMS comes ships with a Digital Asset Manager (DAM) that is great for serving out files.
A very common use case is for these assets to be adjusted in certain ways, like resizing, cropping
etc. XIN Mods adds this functionality out-of-the-box, called "Asset Mods". 

We can tap into this by using the `Image` object.

The `HippoConnection` class exposes two useful methods. One interacts with Image Link field types, the
other works directly off of the binary's UUID in the JCR -- the first uses the latter to work correctly.

To retrieve a file from an image link, and add modifications to the object use it like this: 
    
    const doc = await hippo.getDocumentByUuid("c0c9833c-144a-40a1-a5ba-2fd49aeebe98");
    const image = await hippo.getImageFromLink(doc.items.heroImage);
    console.log("Binary path: ", image.toUrl());
    console.log("Asset mod path: ", image.scaleWidth(320).crop(320, 240).toUrl());
 

Available operations are:

* `image.toUrl()`; converts it into a URL based on the connection properties
* `image.reset()`; removes any operations that were applied to the object previously
* `image.scaleWidth(newWidth)`; scales the image by its width
* `image.scaleHeight(newHeight)`; scales the image by its height
* `image.scale(newWidth, newHeight)`; scales into both dimensions
* `image.greyscale()`; adds a greyscale filter to the image
* `image.brighter(nTimes)`; brightens the image a certain amount, this can be applied multiple times at once
* `image.darker(nTimes)`; darkens the image a certain amount, this can be applied multiples times at once.

## Collections

The XIN Mods contains functionality called `collections`. It's an easy way to push new information into the JCR without
worrying about that state of the document, having to create new folders or other such things. Its interface is inspired by 
simple key-value store APIs such as Google's Firestore.

Find a small snippet of code below that illustrates different aspects of how to interact with the collections endpoints.
    
    const xinmods = require('xinmods');

    const hippo = xinmods.connectTo('http://localhost:8080', 'admin', 'admin');

    const allCollections = await hippo.listCollections();
    console.log("Collections:" , allCollections);
 
    // get a Collections instance   
    const coll = hippo.collection('your-collection');

    // retrieve an item from this collection
    const itemValues = await coll.get("new-folder/an-item-address");
    console.log("ITEM: ", itemValues);
    
    //
    // put some content into the collection.
    // There is a third optional parameter called saveMode allowing you to specify
    // the behaviour of new information that is placed into the collection.
    // - Merge: (the default) merges this map with existing information of creates a new item
    // - Overwrite: if content exists, it is deleted and overwritten with this new map
    // - FailIfExists: cowardly refuse to write to the repo if something already exists. 
    //
    const putSuccess = await coll.put("new-folder/with-item", {
        name: "Your name",
        age: 35,
        length: 1.83,
        time: new Date()
    });
    
    // convenience functions: .putAndOverwrite, .putAndMerge, .putIfNotExists 

    console.log("PUT ITEM SUCCESS? ", putSuccess);
    
    
    //
    //	Delete one item only
    //
    const deleteSuccess = await coll.delete('new-folder/with-item');

    //
    //  Allow recursive deletion by specifying "true" for forceDelete parameter 
    //
    const deleteRecursiveSuccess = await coll.delete('new-folder/with-item', true);

    // You can also query the collection. Fields are written to the node using the
    // xinmods: namespace.
    const query = (
        hippo.collection('attendance').query()
            .where()
                .gte("xinmods:age", 5)
            .end()
        .build()
    );

    const results = await hippo.executeQuery(query);
    console.log(results);

Hope that helps. 

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
