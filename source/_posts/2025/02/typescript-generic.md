---
abbrlink: ''
categories:
- - TypeScript基础
date: '2025-02-18T19:52:32.233310+08:00'
tags:
- TypeScript
title: TypeScript中的泛型
updated: '2025-02-18T19:52:32.758+08:00'
---
# 导读

近端时间面试一直提到``TypeScript`存在泛型，那么什么是泛型，有什么作用，实际的使用场景是什么呢？

[参考文档](https://www.tsdev.cn/generics.html)

# 泛型的定义

一个概念，不管如何，首先从定义入手。

泛型（Generics）通过类型参数（Type Parameters）实现，类型参数是一个**占位符**，表示**未来使用时**可以传入的具体类型。在TypeScript中，泛型通常使用尖括号<T>来表示，其中T是类型参数的名称（可以是任意标识符）。

# 泛型的基本语法

1. **函数中的泛型**

   ```ts
   function identity<T>(arg: T): T {
       return arg;
   }
   ```

   - `T` 是类型参数，表示传入和返回的类型。
   - 调用时可以显式指定类型，也可以让 TypeScript **自动推断**。
2. **类中的泛型**

   typescript

   复制

   ```
   class Box<T> {
       private value: T;
       constructor(value: T) {
           this.value = value;
       }
       getValue(): T {
           return this.value;
       }
   }
   ```

   - `T` 是类的类型参数，用于定义类的属性和方法。
3. **接口中的泛型**

   ```ts
   interface Pair<T, U> {
       first: T;
       second: U;
   }
   ```

   - `T` 和 `U` 是接口的类型参数，用于定义接口的成员类型。

---

### **泛型的核心特点**

1. **类型占位符**
   - 泛型通过类型参数（如 `<T>`）表示一个占位符，具体类型在使用时确定。
   - 例如，`identity<T>` 中的 `T` 可以是 `string`、`number` 或任何其他类型。
2. **类型安全**
   - 泛型在编译时保留类型信息，避免运行时类型错误。
   - 例如，`Box<number>` 确保 `value` 只能是 `number` 类型。
3. **代码复用**
   - 泛型允许编写通用的逻辑，适用于多种类型，减少重复代码。
   - 例如，`identity<T>` 可以处理任何类型，而不需要为每种类型单独编写函数。

---

### **泛型的应用场景**

1. **通用函数**

   - 例如，一个可以处理任意类型数组的函数：

     typescript

     复制

     ```
     function logArray<T>(arr: T[]): void {
         arr.forEach(item => console.log(item));
     }
     logArray<number>([1, 2, 3]); // 处理数字数组
     logArray<string>(["a", "b", "c"]); // 处理字符串数组
     ```
2. **通用数据结构**

   - 例如，一个通用的栈类：

     typescript

     复制

     ```
     class Stack<T> {
         private items: T[] = [];
         push(item: T): void {
             this.items.push(item);
         }
         pop(): T | undefined {
             return this.items.pop();
         }
     }
     const numberStack = new Stack<number>();
     numberStack.push(1);
     numberStack.push(2);
     ```
3. **类型约束**

   - 通过泛型约束（`extends`）限制类型参数的范围：

     typescript

     复制

     ```
     function getLength<T extends { length: number }>(arg: T): number {
         return arg.length;
     }
     getLength("hello"); // 5
     getLength([1, 2, 3]); // 3
     // getLength(42); // 错误：数字没有 length 属性
     ```
4. **工具类型**

   - TypeScript 内置的泛型工具类型（如 `Partial`、`Readonly` 等）：

     typescript

     复制

     ```
     interface User {
         name: string;
         age: number;
     }
     type PartialUser = Partial<User>; // { name?: string; age?: number; }
     ```

---

### **总结**

泛型的定义可以概括为：

- 泛型是一种编程机制，允许在定义函数、类、接口或类型时使用类型参数作为占位符，从而在使用时动态指定具体类型。
- 泛型的核心目标是提高代码的复用性和类型安全性，适用于需要处理多种类型的场景。

通过泛型，开发者可以编写更通用、更灵活的代码，同时保持类型系统的强大支持。
