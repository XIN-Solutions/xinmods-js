import {Image, connectTo, LocalOptions} from "../index.js";

describe("Testing the new module structure", () => {
	
	it("use different elements", async () => {
		/** @type {HippoConnection} */
		const conn = connectTo('http://localhost:8080', 'admin', 'admin', LocalOptions);
		
		const docs = await conn.listDocuments('/content/documents');
		console.log("Docs: ", JSON.stringify(docs, null, 4));
	});
	
})
