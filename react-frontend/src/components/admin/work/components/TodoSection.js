import React, { useState } from 'react';
import { Trash2, Plus, CheckCircle2, Circle } from 'lucide-react';
import '../style/todo.css';
import '../../../../common/global.css';
const TodoSection = () => {
  const [todos, setTodos] = useState([]);
  const [inputValue, setInputValue] = useState('');

  const addTodo = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    setTodos([...todos, { id: Date.now(), text: inputValue, completed: false }]);
    setInputValue('');
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  return (
    <div className="todo-container">
      <h2 className="todo-header">
        <CheckCircle2 className="text-indigo-500" />
        Tasks
      </h2>

      {/* Input Area */}
      <form onSubmit={addTodo} className="todo-form">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="What's the plan?"
          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
        />
        <button 
          type="submit"
          className="save-btn"
        >
          <Plus size={24} />
        </button>
      </form>

      {/* Todo List */}
      <div className="todo-list">
        {todos.length === 0 ? (
          <p className="text-center text-gray-400 py-4">No tasks yet. Enjoy your coffee! ☕</p>
        ) : (
          todos.map(todo => (
            <div 
              key={todo.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                todo.completed ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-200'
              }`}
            >
              <div 
                className="flex items-center gap-3 cursor-pointer flex-1"
                onClick={() => toggleTodo(todo.id)}
              >
                {todo.completed ? (
                  <CheckCircle2 className="text-green-500" size={20} />
                ) : (
                  <Circle className="text-gray-400" size={20} />
                )}
                <span className={`${todo.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                  {todo.text}
                </span>
              </div>
              <button 
                onClick={() => deleteTodo(todo.id)}
                className="delete-btn"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Stats Footer */}
      {todos.length > 0 && (
        <div className="todo-footer">
          <span>{todos.filter(t => t.completed).length} of {todos.length} completed</span>
          <button 
            onClick={() => setTodos([])}
            className="clear-btn"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
};

export default TodoSection;