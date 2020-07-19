const mod = require('../index.js');

const hippo = mod.connectTo('http://localhost:8080', 'admin', 'admin');

// const pkgMgr = hippo.packages();

async function runTests() {

	// TODO: improve error reporting from query functionality in Hippo
	
	const q =
		hippo.newQuery()
			.type('test:article')
			.includePath("/content/documents/site/articles")
			// .excludePath('/content/documents/site/articles')
			//
			// .orderBy('xinmods:publishedDate', 'desc')
			.where()
				// .and()
				// 	.s('test:title', true)
					.isNotNull('test:title')
			// 		.equalsIgnoreCase('mods:description', 'Something great')
			// 		.or()
			// 			.gte('mods:price', 10)
			// 			.lte('mods:price', 100)
			// 		.end()
			// 	.end()
			.end()
			.offset(0)
			.limit(10)
		.build()
	;
	
	console.log("QUERY:\n", q);
	
	const qResult = await hippo.executeQuery(q);
	console.log("RESULT: ", qResult);
	
	
	/*
		const doc = await hippo.getDocumentByUuid("c0c9833c-144a-40a1-a5ba-2fd49aeebe98");
		console.log("Retrieved a document:", doc);

		const list = await hippo.listDocuments("/content/documents/site/articles");
		console.log("Retrieved a folder:", list);

		const {path} = await hippo.uuidToPath("c0c9833c-144a-40a1-a5ba-2fd49aeebe98");
		console.log("Path for uuid: ", path);

		const {uuid} = await hippo.pathToUuid(path);
		console.log("Uuid: ", uuid);

		const docByPath = await hippo.getDocumentByPath(path);
		console.log("Doc:", docByPath);

		const docs = await hippo.getDocuments({
			max: 10,
			query: "mark"
		});
		console.log("All Docs: ", JSON.stringify(docs, null, 4));
	*/

}

runTests().then(() => console.log("Done"));
