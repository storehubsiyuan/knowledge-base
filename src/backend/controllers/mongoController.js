// const Employee = require('../../../models/Employee');
// const mongoose = require('mongoose');

// class MongoController {
//   // VULNERABLE: $ne operator injection
//   async findWithNegation(req, res) {
//     const { username, password } = req.body;

//     // Bug: Direct use of user input in query
//     // Attack: username: {"$ne": null}, password: {"$ne": null}
//     const user = await Employee.findOne({
//       username: username,
//       password: password
//     });

//     if (user) {
//       res.json({
//         authenticated: true,
//         user: user,
//         hint: 'Try {"$ne": null} to bypass'
//       });
//     } else {
//       res.status(401).json({ authenticated: false });
//     }
//   }

//   // VULNERABLE: $where operator injection
//   async searchWithWhere(req, res) {
//     const { searchQuery } = req.body;

//     // Bug: Direct $where usage
//     // Attack: "this.password.match(/.*/) || '1'=='1'"
//     const results = await Employee.find({
//       $where: searchQuery
//     });

//     res.json({
//       results: results,
//       warning: '$where executes JavaScript'
//     });
//   }

//   // VULNERABLE: $regex operator injection
//   async searchByPattern(req, res) {
//     const { fieldName, pattern, flags } = req.body;

//     // Bug: Unvalidated regex pattern
//     // Attack: pattern: ".*", flags: "i" to match everything
//     const query = {};
//     query[fieldName] = {
//       $regex: pattern,
//       $options: flags || 'i'
//     };

//     const results = await Employee.find(query);

//     res.json({
//       matched: results,
//       query: query,
//       hint: 'Try .* to match all'
//     });
//   }

//   // VULNERABLE: $exists operator injection
//   async checkFieldExists(req, res) {
//     const { filters } = req.body;

//     // Bug: Direct filter object usage
//     // Attack: {"isAdmin": {"$exists": true}}
//     const results = await Employee.find(filters);

//     res.json({
//       found: results,
//       exposedFields: Object.keys(results[0] || {}),
//       hint: 'Use $exists to discover fields'
//     });
//   }

//   // VULNERABLE: Complex operator injection
//   async advancedSearch(req, res) {
//     const { query } = req.body;

//     // Bug: Passing entire query object
//     // Allows any MongoDB operator
//     const results = await Employee.find(query).limit(100);

//     res.json({
//       results: results,
//       operators: ['$gt', '$lt', '$in', '$nin', '$or', '$and'],
//       hint: 'Combine operators for complex attacks'
//     });
//   }

//   // VULNERABLE: Update operator injection
//   async updateProfile(req, res) {
//     const { userId, updates } = req.body;

//     // Bug: Direct update object usage
//     // Attack: {"$set": {"role": "admin"}, "$unset": {"restrictions": 1}}
//     const result = await Employee.findByIdAndUpdate(
//       userId,
//       updates, // Unvalidated updates
//       { new: true }
//     );

//     res.json({
//       updated: result,
//       hint: 'Use $set, $unset, $inc, $push operators'
//     });
//   }

//   // VULNERABLE: Aggregation pipeline injection
//   async getStatistics(req, res) {
//     const { pipeline } = req.body;

//     // Bug: User controls entire pipeline
//     // Attack: [{"$match": {}}, {"$group": {"_id": "$password"}}]
//     const results = await Employee.aggregate(pipeline);

//     res.json({
//       statistics: results,
//       warning: 'Pipeline stages exposed',
//       stages: ['$match', '$group', '$project', '$lookup']
//     });
//   }

//   // VULNERABLE: $lookup injection
//   async joinCollections(req, res) {
//     const { lookupStage } = req.body;

//     // Bug: User-controlled $lookup
//     const pipeline = [
//       { $match: { isActive: true } },
//       lookupStage // User can join any collection
//     ];

//     const results = await Employee.aggregate(pipeline);

//     res.json({
//       joined: results,
//       hint: 'Use $lookup to access other collections'
//     });
//   }

//   // VULNERABLE: Text search injection
//   async textSearch(req, res) {
//     const { searchText, searchOptions } = req.body;

//     // Bug: Unvalidated text search
//     const results = await Employee.find({
//       $text: {
//         $search: searchText,
//         ...searchOptions // User can add $language, $caseSensitive
//       }
//     });

//     res.json({
//       results: results,
//       options: searchOptions
//     });
//   }

//   // VULNERABLE: MapReduce injection
//   async mapReduce(req, res) {
//     const { mapFunction, reduceFunction } = req.body;

//     // Bug: User-provided functions
//     // These are strings that will be evaluated
//     const options = {
//       map: mapFunction,
//       reduce: reduceFunction,
//       out: { inline: 1 }
//     };

//     Employee.mapReduce(options, (err, results) => {
//       if (err) {
//         res.status(500).json({ error: err.message });
//       } else {
//         res.json({
//           results: results,
//           warning: 'MapReduce executes JavaScript'
//         });
//       }
//     });
//   }

//   // VULNERABLE: findOneAndUpdate with operators
//   async updateSingleRecord(req, res) {
//     const { filter, update, options } = req.body;

//     // Bug: All parameters user-controlled
//     const result = await Employee.findOneAndUpdate(
//       filter,  // Can use any query operators
//       update,  // Can use any update operators
//       options  // Can set returnOriginal: false, upsert: true
//     );

//     res.json({
//       result: result,
//       hint: 'Control filter, update, and options'
//     });
//   }

//   // VULNERABLE: Distinct with field injection
//   async getDistinctValues(req, res) {
//     const { field, query } = req.body;

//     // Bug: Field name injection
//     // Can access any field including sensitive ones
//     const values = await Employee.distinct(field, query || {});

//     res.json({
//       field: field,
//       distinctValues: values,
//       hint: 'Try "password" or other sensitive fields'
//     });
//   }

//   // VULNERABLE: Count with operator injection
//   async countDocuments(req, res) {
//     const { countQuery } = req.body;

//     // Bug: Direct query usage in count
//     const count = await Employee.countDocuments(countQuery);

//     res.json({
//       count: count,
//       query: countQuery,
//       hint: 'Use operators to count privileged users'
//     });
//   }

//   // VULNERABLE: Bulk operations injection
//   async bulkOperations(req, res) {
//     const { operations } = req.body;

//     // Bug: User controls bulk operations
//     // Can mix inserts, updates, deletes
//     const bulkOps = operations.map(op => {
//       if (op.type === 'insert') {
//         return { insertOne: { document: op.document } };
//       } else if (op.type === 'update') {
//         return { updateOne: { filter: op.filter, update: op.update } };
//       } else if (op.type === 'delete') {
//         return { deleteOne: { filter: op.filter } };
//       }
//     });

//     const result = await Employee.bulkWrite(bulkOps);

//     res.json({
//       result: result,
//       operations: operations.length,
//       hint: 'Mix operations for maximum damage'
//     });
//   }
// }

// module.exports = new MongoController();
