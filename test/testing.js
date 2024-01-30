const mod = require('../src');

/**
 * @type {HippoConnection}
 */
const hippo = mod.connectTo('http://localhost:8080', 'admin', 'admin');

async function runTests() {

	const compoundQ = hippo.newQuery();
	const familiarName =
		hippo.newClause('or')
			.equals("xinmods:name", "John Doe")
			.equals("xinmods:name", "Jane Doe")
	;

	const ageRange =
		hippo.newClause('and')
			.gte('xinmods:age', 20)
			.lte('xinmods:age', 50)
	;

	const queryStr = compoundQ.where().and(familiarName, ageRange).end().build();
	console.log(queryStr);

	const docs = await hippo.getDocuments({
		max: 10,
		nodeType: "xinmods:article"
	});
	console.log("All Docs: ", JSON.stringify(docs, null, 4));


	const firstUuid = docs.items[0].id;
	const doc = await hippo.getDocumentByUuid(firstUuid);
	console.log("Retrieved a document:", JSON.stringify(doc, null, 4));

	const q =
		hippo.newQuery()
			.type('xinmods:article')
			.includePath("/content")
			.offset(0)
			.limit(10)
		.build()
	;

	console.log("QUERY:\n", q);

	const qResult =
		await hippo.executeQuery(q, {
			namespace: true,
			documents: true
		});

	console.log("RESULT: ", qResult);

	const image = await hippo.getImageFromLink(doc.items.image);
	console.log("Binary path: ", image.toUrl());
	console.log("Asset mod path: ", image.scaleWidth(320).crop(320, 240).toUrl());

	const list = await hippo.listDocuments("/content/documents/site/articles");
	console.log("Retrieved a folder:", list);

	const {path} = await hippo.uuidToPath(firstUuid);
	console.log("Path for uuid: ", path);

	const {uuid} = await hippo.pathToUuid(path);
	console.log("Uuid: ", uuid);

	const docByPath = await hippo.getDocumentByPath(path);
	console.log("Doc:", docByPath);
}

runTests().then(() => console.log("Done"));
