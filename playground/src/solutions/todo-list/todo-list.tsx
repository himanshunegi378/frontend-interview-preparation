import { useState } from "react";

type TodoItem = {
    title: string
}

export default function TodoList() {
    const [todos, setTodos] = useState<Array<TodoItem>>([])
    const [newTodo, setNewTodo] = useState<TodoItem>({
        title: ''
    })

    return (
        <div>
            <h1>Todo List</h1>
            <div>
                <label>
                    Task
                    <input type="text" placeholder="Add your task" value={newTodo.title} onChange={e => {
                        const title = e.target.value;
                        setNewTodo({
                            title: title
                        })
                    }} />
                </label>
                <div>
                    <button disabled={Boolean(newTodo.title.trim()) === false} onClick={() => {
                        setTodos([...todos, { title: newTodo.title }])
                        setNewTodo({
                            title: ''
                        })
                    }}>Submit</button>
                </div>
            </div>
            <ul>
                {todos.map((todo, i) => {
                    return <li key={i}>
                        <span>{todo.title}</span>
                        <button onClick={() => {
                            setTodos(todos.filter((_, index) => {
                                if (index === i) {
                                    return false
                                }

                                return true
                            }))
                        }}>Delete</button>
                    </li>
                })}
                <li>
                    <span>Walk the dog</span>
                    <button>Delete</button>
                </li>
                <li>
                    <span>Water the plants</span>
                    <button>Delete</button>
                </li>
                <li>
                    <span>Wash the dishes</span>
                    <button>Delete</button>
                </li>
            </ul>
        </div>
    );
}
