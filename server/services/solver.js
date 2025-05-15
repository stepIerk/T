import * as math from 'mathjs';
import nerdamer from 'nerdamer';
import 'nerdamer/Algebra.js';
import 'nerdamer/Calculus.js';
import 'nerdamer/Solve.js';
import 'nerdamer/all.js';

import Together from 'together-ai/index.mjs';

import dotenv from "dotenv";
dotenv.config();


const together = new Together(
    {
        apiKey: `${process.env.TOGETHER_API_KEY}`,
    }
);


export function simplifyFractions(expression) {
    try {
        let simplified = nerdamer(`simplify(${expression})`).toString();

        let expanded = nerdamer(simplified).expand().toString();

        return expanded.length < simplified.length ? expanded : simplified;
    } catch (error) {
        console.error('Ошибка при упрощении дроби:', error);
        return expression;
    }
}

export function solveLinerEquation(equation, variable = 'x') {

    let originalEquation = equation;
    try {
        const steps = [];

        steps.push(`Исходное уравнение: ${equation}`);

        let simplified = nerdamer(`simplify(${equation})`).toString();
        steps.push(`Упрощенное уравнение: ${simplified}`);

        let solutions = nerdamer.solve(simplified, variable);
        let solutionText = solutions.toString();
        let answer = solutionText.length > 0 ? solutionText.slice(1, -1) : 'Нет решения';


        steps.push(`Решение: ${variable} = ${solutionText}`);

        return {
            originalEquation: originalEquation,
            solution: answer,
        };

    } catch (error) {
        console.error('Ошибка при решении уравнения:', error);
        return {
            originalEquation: originalEquation,
            solution: 'Нет решения',
        };
    }
}

export function solveArithmetic(expression) {
    try {
        const originalExpression = expression;
        let simplified = nerdamer(`simplify(${expression})`).toString();
        return {
            originalExpression: originalExpression,
            solution: simplified,
        }
    } catch (error) {
        console.error('Ошибка при решении выражения:', error);
    }
}

// console.log(solveLinerEquation("2/3*x + 1/4 = 5/6 + 2/3*x"));
// console.log(solveArithmetic("2 + 3(4 + 3)"));
// console.log(solveArithmetic("3(23/69)"));



export function classifyTask(task) {
    const text = task.text.toLowerCase();
    const examples = task.examples;
    console.log("Task text:", text);
    console.log("Task examples:", examples);

    // Проверка на текстовые задачи (сложные)
    const isTextTask = text.includes("задача") ||
        text.includes("условие") ||
        text.includes("поезд") ||
        text.includes("скорость") ||
        text.includes("возраст") ||
        text.includes("количество") ||
        text.includes("велосипед") ||
        text.includes("расстояние") ||
        text.includes("время") ||
        text.includes("проеx") ||
        text.includes("цена") ||
        text.includes("стоимость");

    if (isTextTask) {
        return "text_task";
    }

    const isEquation = text.includes("уравнени") ||
        text.includes("корн") ||
        text.includes("решит") ||
        text.includes("найди") ||
        text.includes("решение");


    const isFraction = text.includes("дроб") ||
        text.includes("числитель") ||
        text.includes("знаменатель") ||
        text.includes("сократи") ||
        text.includes("привед") ||
        examples.some(ex => ex.includes("/"));

    const isArithmetic = text.includes("вычисли") ||
        text.includes("упрости") ||
        text.includes("выражени") ||
        text.includes("значени");


    // на всякий добиваем проверку примерами

    const examplesAnalysis = examples.map(example => {
        if (example.includes("=")) {
            if (example.includes("/") || example.match(/[0-9]+\/[0-9]+/)) {
                return "fractional_equation";
            }
            return "linear_equation";
        } else if (example.includes("/") || example.match(/[0-9]+\/[0-9]+/)) {
            return "fraction";
        } else {
            return "arithmetic";
        }
    });

    if (examplesAnalysis.includes("fractional_equation")) {
        return "fractional_equation";
    } else if (examplesAnalysis.includes("linear_equation")) {
        return "linear_equation";
    } else if (examplesAnalysis.includes("fraction")) {
        return "fraction";
    } else if (isEquation) {
        return "linear_equation";
    } else if (isFraction) {
        return "fraction";
    } else if (isArithmetic) {
        return "arithmetic";
    } else {
        return "arithmetic";
    }
}

// TogetherAI: Делайте до 60 запросов в минуту в LLMS в бесплатной версии
async function solveTextTask(task) {
    const taskText = task.text;
    const examples = task.examples.map(example => `- ${example}`).join('\n');

    try {
        console.log("Чувак думает...")
        const prompt = `Реши задачу:\n\nЗадание: ${taskText}\n\nПримеры:\n${examples}\n\nНапиши только ответ!`;

        const response = await together.chat.completions.create({
            model: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
            messages: [{
                role: "user",
                content: [
                    { type: "text", text: prompt }
                ]
            }],
            max_tokens: 1000
        });
        console.log("Чувак решил:", response.choices[0].message.content);
        return response.choices[0].message.content;
    } catch (error) {
        console.error('ошибка при обращении к Together API:', error);
        return "не удалось решить задачу даже с помощью Together AI. Жесть";
    }
}

export async function solveTask(task) {
    console.log('Задание:', task)
    const taskType = classifyTask(task);
    console.log('Тип задания:', taskType);
    const results = {
        text: task.text,
        type: taskType,
        examples: []
    };

    if (taskType === "text_task") {
        results.solution = await solveTextTask(task);
        return results;
    }

    const examples = []

    task.examples.forEach((example, index) => {
        if (taskType === "linear_equation" || taskType === "fractional_equation") {
            results.examples[index] = solveLinerEquation(example);
        } else if (taskType === "fraction") {
            results.examples[index] = simplifyFractions(example);
        } else if (taskType === "arithmetic") {
            results.examples[index] = solveArithmetic(example);
        }
    });
    console.log("резы: " + results.examples);

    return results;
}

// своеобразные тесты

const fractionalEquationTask = {
    text: "Решите уравнения с дробями:",
    examples: [
        "2/3*x + 1/4 = 5/6",
        "x/2 = 3/4"
    ]
};

const fractionTask = {
    text: "Сократите дроби:",
    examples: [
        "23/69",
        "15/25"
    ]
};


console.log('first ', solveTask(fractionalEquationTask));
console.log('second ', solveTask(fractionTask));