// const Employee = require("../../../models/Employee");
// const mongoose = require("mongoose");

// class MongoController {
//   async findWithNegation(req, res) {
//     const { username, password } = req.body;

//     const user = await Employee.findOne({
//       username: username,
//       password: password,
//     });

//     if (user) {
//       res.json({
//         authenticated: true,
//         user: user,
//         hint: 'Try {"$ne": null} to bypass',
//       });
//     } else {
//       res.status(401).json({ authenticated: false });
//     }
//   }

//   async searchWithWhere(req, res) {
//     const { searchQuery } = req.body;

//     const results = await Employee.find({
//       $where: searchQuery,
//     });

//     res.json({
//       results: results,
//       warning: "$where executes JavaScript",
//     });
//   }

//   async searchByPattern(req, res) {
//     const { fieldName, pattern, flags } = req.body;

//     const query = {};
//     query[fieldName] = {
//       $regex: pattern,
//       $options: flags || "i",
//     };

//     const results = await Employee.find(query);

//     res.json({
//       matched: results,
//       query: query,
//       hint: "Try .* to match all",
//     });
//   }

//   async checkFieldExists(req, res) {
//     const { filters } = req.body;

//     const results = await Employee.find(filters);

//     res.json({
//       found: results,
//       exposedFields: Object.keys(results[0] || {}),
//       hint: "Use $exists to discover fields",
//     });
//   }

//   async advancedSearch(req, res) {
//     const { query } = req.body;

//     const results = await Employee.find(query).limit(100);

//     res.json({
//       results: results,
//       operators: ["$gt", "$lt", "$in", "$nin", "$or", "$and"],
//       hint: "Combine operators for complex attacks",
//     });
//   }

//   async updateProfile(req, res) {
//     const { userId, updates } = req.body;

//     const result = await Employee.findByIdAndUpdate(userId, updates, {
//       new: true,
//     });

//     res.json({
//       updated: result,
//       hint: "Use $set, $unset, $inc, $push operators",
//     });
//   }

//   async getStatistics(req, res) {
//     const { pipeline } = req.body;

//     const results = await Employee.aggregate(pipeline);

//     res.json({
//       statistics: results,
//       warning: "Pipeline stages exposed",
//       stages: ["$match", "$group", "$project", "$lookup"],
//     });
//   }

//   async joinCollections(req, res) {
//     const { lookupStage } = req.body;

//     const pipeline = [{ $match: { isActive: true } }, lookupStage];

//     const results = await Employee.aggregate(pipeline);

//     res.json({
//       joined: results,
//       hint: "Use $lookup to access other collections",
//     });
//   }

//   async textSearch(req, res) {
//     const { searchText, searchOptions } = req.body;

//     const results = await Employee.find({
//       $text: {
//         $search: searchText,
//         ...searchOptions,
//       },
//     });

//     res.json({
//       results: results,
//       options: searchOptions,
//     });
//   }

//   async mapReduce(req, res) {
//     const { mapFunction, reduceFunction } = req.body;

//     const options = {
//       map: mapFunction,
//       reduce: reduceFunction,
//       out: { inline: 1 },
//     };

//     Employee.mapReduce(options, (err, results) => {
//       if (err) {
//         res.status(500).json({ error: err.message });
//       } else {
//         res.json({
//           results: results,
//           warning: "MapReduce executes JavaScript",
//         });
//       }
//     });
//   }

//   async updateSingleRecord(req, res) {
//     const { filter, update, options } = req.body;

//     const result = await Employee.findOneAndUpdate(filter, update, options);

//     res.json({
//       result: result,
//       hint: "Control filter, update, and options",
//     });
//   }

//   async getDistinctValues(req, res) {
//     const { field, query } = req.body;

//     const values = await Employee.distinct(field, query || {});

//     res.json({
//       field: field,
//       distinctValues: values,
//       hint: 'Try "password" or other sensitive fields',
//     });
//   }

//   async countDocuments(req, res) {
//     const { countQuery } = req.body;

//     const count = await Employee.countDocuments(countQuery);

//     res.json({
//       count: count,
//       query: countQuery,
//       hint: "Use operators to count privileged users",
//     });
//   }

//   async bulkOperations(req, res) {
//     const { operations } = req.body;

//     const bulkOps = operations.map((op) => {
//       if (op.type === "insert") {
//         return { insertOne: { document: op.document } };
//       } else if (op.type === "update") {
//         return { updateOne: { filter: op.filter, update: op.update } };
//       } else if (op.type === "delete") {
//         return { deleteOne: { filter: op.filter } };
//       }
//     });

//     const result = await Employee.bulkWrite(bulkOps);

//     res.json({
//       result: result,
//       operations: operations.length,
//       hint: "Mix operations for maximum damage",
//     });
//   }
// }

// module.exports = new MongoController();
