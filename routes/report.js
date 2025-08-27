const express = require("express");
const router = express.Router();
const EventRegistration = require("../models/EventRegistration");
const Contact = require("../models/Contact");
const Newsletter = require("../models/Newsletter");
const { Parser } = require("json2csv");

const getPagination = (page, size) => {
  const limit = size ? +size : 10;
  const offset = page ? (page - 1) * limit : 0;
  return { limit, offset };
};

const getPagingData = (totalItems, records, page, limit) => {
  const currentPage = page ? +page : 1;
  const totalPages = Math.ceil(totalItems / limit);
  return { totalItems, records, totalPages, currentPage };
};

const fetchData = async (model, page, size) => {
    try {
        const { limit, offset } = getPagination(page, size);
        const totalItems = await model.countDocuments().exec();
        const records = await model.find().sort({ createdAt: -1 }).skip(offset).limit(limit).lean().exec();
        return getPagingData(totalItems, records, page, limit);
    } catch (error) {
        console.error(`Error fetching data from ${model.modelName}:`, error);
        return {
            totalItems: 0,
            records: [],
            totalPages: 0,
            currentPage: page || 1
        };
    }
};

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const size = parseInt(req.query.size) || 10;
    const modelType = req.query.model || 'all';
    
    // Set EJS options
    const ejsOptions = {
      async: false, // Disable async mode to prevent issues with try/catch
      strict: true, // Enable strict mode to catch undefined variables
      _with: false, // Disable with() statements which are deprecated
      localsName: 'locals', // Default locals name
      cache: process.env.NODE_ENV === 'production', // Cache templates in production
      compileDebug: process.env.NODE_ENV !== 'production', // Only compile debug in development
      debug: process.env.NODE_ENV !== 'production', // Only show debug info in development
    };

    // Only fetch the data we need based on the active tab
    const fetchPromises = [];
    
    if (modelType === 'all' || modelType === 'events') {
      fetchPromises.push(fetchData(EventRegistration, page, size));
    } else {
      fetchPromises.push(Promise.resolve({
        totalItems: 0,
        records: [],
        totalPages: 0,
        currentPage: 1
      }));
    }

    if (modelType === 'all' || modelType === 'contacts') {
      fetchPromises.push(fetchData(Contact, page, size));
    } else {
      fetchPromises.push(Promise.resolve({
        totalItems: 0,
        records: [],
        totalPages: 0,
        currentPage: 1
      }));
    }

    if (modelType === 'all' || modelType === 'newsletters') {
      fetchPromises.push(fetchData(Newsletter, page, size));
    } else {
      fetchPromises.push(Promise.resolve({
        totalItems: 0,
        records: [],
        totalPages: 0,
        currentPage: 1
      }));
    }

    const [eventRegistrations, contacts, newsletters] = await Promise.all(fetchPromises);

    // Ensure all required properties exist
    const data = {
      eventRegistrations: {
        totalItems: eventRegistrations.totalItems || 0,
        records: eventRegistrations.records || [],
        totalPages: eventRegistrations.totalPages || 0,
        currentPage: eventRegistrations.currentPage || 1
      },
      contacts: {
        totalItems: contacts.totalItems || 0,
        records: contacts.records || [],
        totalPages: contacts.totalPages || 0,
        currentPage: contacts.currentPage || 1
      },
      newsletters: {
        totalItems: newsletters.totalItems || 0,
        records: newsletters.records || [],
        totalPages: newsletters.totalPages || 0,
        currentPage: newsletters.currentPage || 1
      },
      currentModel: modelType
    };

    res.render("report", data);
  } catch (error) {
    console.error("Error in report route:", error);
    // Render the page with empty data but don't crash
    res.render("report", {
      eventRegistrations: { totalItems: 0, records: [], totalPages: 0, currentPage: 1 },
      contacts: { totalItems: 0, records: [], totalPages: 0, currentPage: 1 },
      newsletters: { totalItems: 0, records: [], totalPages: 0, currentPage: 1 },
      error: "Error loading data. Please try again later."
    });
  }
});

router.get("/download/:model", async (req, res) => {
  try {
    const { model } = req.params;
    let records;
    let Model;

    switch (model) {
      case "eventRegistration":
        Model = EventRegistration;
        break;
      case "contact":
        Model = Contact;
        break;
      case "newsletter":
        Model = Newsletter;
        break;
      default:
        return res.status(400).send("Invalid model");
    }

    records = await Model.find();

    if (!records || records.length === 0) {
      return res.status(404).send("No records found");
    }

    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(records.map(record => record.toJSON()));

    res.header("Content-Type", "text/csv");
    res.attachment(`${model}.csv`);
    res.send(csv);
  } catch (error) {
    console.error("Error downloading records:", error);
    res.status(500).send("Error downloading records");
  }
});

module.exports = router;
