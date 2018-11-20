const { GraphQLServer } = require('graphql-yoga');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const express = require('express');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/MERN');

const Todo = mongoose.model('Todo', {
  text: String,
  complete: Boolean
});

const typeDefs = `
  type Query {
    hello(name: String): String!
    todos: [Todo]
  }
  type Todo {
    id: ID
    text: String!
    complete: Boolean!
  }
  type Mutation {
    createTodo(text: String!): Todo
    updateTodo(id: ID!, complete: Boolean!): Boolean
    removeTodo(id: ID!): Boolean
  }
`;

const resolvers = {
  Query: {
    hello: (_, { name }) => `Hello ${name || 'World'}`,
    todos: () => Todo.find()
  },
  Mutation: {
    createTodo: async (_, { text }) => {
      const todo = new Todo({ text, complete: false });
      await todo.save();
      return todo;
    },
    updateTodo: async (_, { id, complete }) => {
      await Todo.findByIdAndUpdate(id, { complete });
      return true;
    },
    removeTodo: async (_, { id }) => {
      await Todo.findByIdAndRemove(id);
      return true;
    }
  }
};

const options = {
  port: process.env.PORT || 5000,
  endpoint: '/graphql'
};

const server = new GraphQLServer({ typeDefs, resolvers });
mongoose.connection.once('open', function() {
  server.express.use(cors());
  server.express.use(express.static(path.join(__dirname, 'client', 'build')));
  server.express.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
  });
  server.start(options, () =>
    console.log(
      `Server running at http://localhost:${options.port}${options.endpoint}`
    )
  );
});
