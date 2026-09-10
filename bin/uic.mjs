#!/usr/bin/env node

// src/cli/index.ts
import { mkdir as mkdir2, readFile as readFile30, realpath as realpath3, stat as stat12, writeFile as writeFile7 } from "node:fs/promises";
import { basename as basename8, dirname as dirname15, join as join23, relative as relative12, resolve as resolve9 } from "node:path";

// src/layers/detect.ts
import { readFile as readFile2, readdir as readdir2, stat as stat2 } from "node:fs/promises";
import { basename as basename2, dirname as dirname2, join as join2, resolve as resolve2, sep as sep2 } from "node:path";

// src/layers/tsconfig.ts
import { readFile, readdir, stat } from "node:fs/promises";
import { basename, dirname, join, relative as relative2, resolve, sep } from "node:path";

// node_modules/@babel/parser/lib/index.js
var Position = class {
  constructor(line, col, index) {
    this.line = void 0;
    this.column = void 0;
    if (index !== void 0) this.index = void 0;
    this.line = line;
    this.column = col;
    if (index !== void 0) this.index = index;
  }
};
var SourceLocation = class {
  start;
  end;
  filename;
  identifierName;
  constructor(start, end) {
    this.start = start;
    this.end = end;
  }
};
function createPositionWithColumnOffset(position, columnOffset) {
  const {
    line,
    column,
    index
  } = position;
  return new Position(line, column + columnOffset, index + columnOffset);
}
var code = "BABEL_PARSER_SOURCETYPE_MODULE_REQUIRED";
var ModuleErrors = {
  ImportMetaOutsideModule: {
    message: `import.meta may appear only with 'sourceType: "module"'`,
    code
  },
  ImportOutsideModule: {
    message: `'import' and 'export' may appear only with 'sourceType: "module"'`,
    code
  }
};
var NodeDescriptions = {
  ArrayPattern: "array destructuring pattern",
  AssignmentExpression: "assignment expression",
  AssignmentPattern: "assignment expression",
  ArrowFunctionExpression: "arrow function expression",
  ConditionalExpression: "conditional expression",
  CatchClause: "catch clause",
  ForOfStatement: "for-of statement",
  ForInStatement: "for-in statement",
  ForStatement: "for-loop",
  FormalParameters: "function parameter list",
  Identifier: "identifier",
  ImportSpecifier: "import specifier",
  ImportDefaultSpecifier: "import default specifier",
  ImportNamespaceSpecifier: "import namespace specifier",
  ObjectPattern: "object destructuring pattern",
  ParenthesizedExpression: "parenthesized expression",
  RestElement: "rest element",
  UpdateExpression: {
    true: "prefix operation",
    false: "postfix operation"
  },
  VariableDeclarator: "variable declaration",
  YieldExpression: "yield expression"
};
var toNodeDescription = (node) => node.type === "UpdateExpression" ? NodeDescriptions.UpdateExpression[`${node.prefix}`] : NodeDescriptions[node.type];
var StandardErrors = {
  AccessorIsGenerator: ({
    kind
  }) => `A ${kind}ter cannot be a generator.`,
  ArgumentsInClass: "'arguments' is only allowed in functions and class methods.",
  AsyncFunctionInSingleStatementContext: "Async functions can only be declared at the top level or inside a block.",
  AwaitBindingIdentifier: "Can not use 'await' as identifier inside an async function.",
  AwaitBindingIdentifierInStaticBlock: "Can not use 'await' as identifier inside a static block.",
  AwaitExpressionFormalParameter: "'await' is not allowed in async function parameters.",
  AwaitUsingNotInAsyncContext: "'await using' is only allowed within async functions and at the top levels of modules.",
  AwaitNotInAsyncContext: "'await' is only allowed within async functions and at the top levels of modules.",
  BadGetterArity: "A 'get' accessor must not have any formal parameters.",
  BadSetterArity: "A 'set' accessor must have exactly one formal parameter.",
  BadSetterRestParameter: "A 'set' accessor function argument must not be a rest parameter.",
  ConstructorClassField: "Classes may not have a field named 'constructor'.",
  ConstructorClassPrivateField: "Classes may not have a private field named '#constructor'.",
  ConstructorIsAccessor: "Class constructor may not be an accessor.",
  ConstructorIsAsync: "Constructor can't be an async function.",
  ConstructorIsGenerator: "Constructor can't be a generator.",
  DeclarationMissingInitializer: ({
    kind
  }) => `Missing initializer in ${kind} declaration.`,
  DecoratorArgumentsOutsideParentheses: "Decorator arguments must be moved inside parentheses: use '@(decorator(args))' instead of '@(decorator)(args)'.",
  DecoratorsBeforeAfterExport: "Decorators can be placed *either* before or after the 'export' keyword, but not in both locations at the same time.",
  DecoratorConstructor: "Decorators can't be used with a constructor. Did you mean '@dec class { ... }'?",
  DecoratorSemicolon: "Decorators must not be followed by a semicolon.",
  DecoratorStaticBlock: "Decorators can't be used with a static block.",
  DeferImportRequiresNamespace: 'Only `import defer * as x from "./module"` is valid.',
  DeletePrivateField: "Deleting a private field is not allowed.",
  DestructureNamedImport: "ES2015 named imports do not destructure. Use another statement for destructuring after the import.",
  DuplicateConstructor: "Duplicate constructor in the same class.",
  DuplicateDefaultExport: "Only one default export allowed per module.",
  DuplicateExport: ({
    exportName
  }) => `\`${exportName}\` has already been exported. Exported identifiers must be unique.`,
  DuplicateProto: "Redefinition of __proto__ property.",
  DuplicateRegExpFlags: "Duplicate regular expression flag.",
  ElementAfterRest: "Rest element must be last element.",
  EscapedCharNotAnIdentifier: "Invalid Unicode escape.",
  ExportBindingIsString: ({
    localName,
    exportName
  }) => `A string literal cannot be used as an exported binding without \`from\`.
- Did you mean \`export { '${localName}' as '${exportName}' } from 'some-module'\`?`,
  ExportDefaultFromAsIdentifier: "'from' is not allowed as an identifier after 'export default'.",
  ForInOfLoopInitializer: ({
    type
  }) => `'${type === "ForInStatement" ? "for-in" : "for-of"}' loop variable declaration may not have an initializer.`,
  ForInUsing: "For-in loop may not start with 'using' declaration.",
  ForOfAsync: "The left-hand side of a for-of loop may not be 'async'.",
  ForOfLet: "The left-hand side of a for-of loop may not start with 'let'.",
  GeneratorInSingleStatementContext: "Generators can only be declared at the top level or inside a block.",
  IllegalBreakContinue: ({
    type
  }) => `Unsyntactic ${type === "BreakStatement" ? "break" : "continue"}.`,
  IllegalLanguageModeDirective: "Illegal 'use strict' directive in function with non-simple parameter list.",
  IllegalReturn: "'return' outside of function.",
  ImportBindingIsString: ({
    importName
  }) => `A string literal cannot be used as an imported binding.
- Did you mean \`import { "${importName}" as foo }\`?`,
  ImportCallArity: ({
    phase
  }) => `\`import${phase ? `.${phase}` : ""}()\` requires exactly one or two arguments.`,
  ImportCallNotNewExpression: ({
    phase
  }) => `Cannot use new with import${phase ? `.${phase}` : ""}().`,
  ImportCallSpreadArgument: ({
    phase
  }) => `\`...\` is not allowed in \`import${phase ? `.${phase}` : ""}()\`.`,
  IncompatibleRegExpUVFlags: "The 'u' and 'v' regular expression flags cannot be enabled at the same time.",
  InvalidBigIntLiteral: "Invalid BigIntLiteral.",
  InvalidCodePoint: "Code point out of bounds.",
  InvalidCoverDiscardElement: "'void' must be followed by an expression when not used in a binding position.",
  InvalidCoverInitializedName: "Invalid shorthand property initializer.",
  InvalidDigit: ({
    radix
  }) => `Expected number in radix ${radix}.`,
  InvalidEscapeSequence: "Bad character escape sequence.",
  InvalidEscapeSequenceTemplate: "Invalid escape sequence in template.",
  InvalidEscapedReservedWord: ({
    reservedWord
  }) => `Escape sequence in keyword ${reservedWord}.`,
  InvalidIdentifier: ({
    identifierName
  }) => `Invalid identifier ${identifierName}.`,
  InvalidLhs: ({
    ancestor
  }) => `Invalid left-hand side in ${toNodeDescription(ancestor)}.`,
  InvalidLhsBinding: ({
    ancestor
  }) => `Binding invalid left-hand side in ${toNodeDescription(ancestor)}.`,
  InvalidLhsOptionalChaining: ({
    ancestor
  }) => `Invalid optional chaining in the left-hand side of ${toNodeDescription(ancestor)}.`,
  InvalidNumber: "Invalid number.",
  InvalidOrMissingExponent: "Floating-point numbers require a valid exponent after the 'e'.",
  InvalidOrUnexpectedToken: ({
    unexpected
  }) => `Unexpected character '${unexpected}'.`,
  InvalidParenthesizedAssignment: "Invalid parenthesized assignment pattern.",
  InvalidPrivateFieldResolution: ({
    identifierName
  }) => `Private name #${identifierName} is not defined.`,
  InvalidPropertyBindingPattern: "Binding member expression.",
  InvalidRestAssignmentPattern: "Invalid rest operator's argument.",
  LabelRedeclaration: ({
    labelName
  }) => `Label '${labelName}' is already declared.`,
  LetInLexicalBinding: "'let' is disallowed as a lexically bound name.",
  LineTerminatorBeforeArrow: "No line break is allowed before '=>'.",
  MalformedRegExpFlags: "Invalid regular expression flag.",
  MissingClassName: "A class name is required.",
  MissingEqInAssignment: "Only '=' operator can be used for specifying default value.",
  MissingSemicolon: "Missing semicolon.",
  MissingPlugin: ({
    missingPlugin
  }) => `This experimental syntax requires enabling the parser plugin: ${missingPlugin.map((name) => JSON.stringify(name)).join(", ")}.`,
  MissingOneOfPlugins: ({
    missingPlugin
  }) => `This experimental syntax requires enabling one of the following parser plugin(s): ${missingPlugin.map((name) => JSON.stringify(name)).join(", ")}.`,
  MissingUnicodeEscape: "Expecting Unicode escape sequence \\uXXXX.",
  MixingCoalesceWithLogical: "Nullish coalescing operator(??) requires parens when mixing with logical operators.",
  ModuleAttributeInvalidValue: "Only string literals are allowed as module attribute values.",
  ModuleAttributesWithDuplicateKeys: ({
    key
  }) => `Duplicate key "${key}" is not allowed in module attributes.`,
  ModuleExportNameHasLoneSurrogate: ({
    surrogateCharCode
  }) => `An export name cannot include a lone surrogate, found '\\u${surrogateCharCode.toString(16)}'.`,
  ModuleExportUndefined: ({
    localName
  }) => `Export '${localName}' is not defined.`,
  MultipleDefaultsInSwitch: "Multiple default clauses.",
  NewlineAfterThrow: "Illegal newline after throw.",
  NoCatchOrFinally: "Missing catch or finally clause.",
  NumberIdentifier: "Identifier directly after number.",
  NumericSeparatorInEscapeSequence: "Numeric separators are not allowed inside unicode escape sequences or hex escape sequences.",
  ObsoleteAwaitStar: "'await*' has been removed from the async functions proposal. Use Promise.all() instead.",
  OptionalChainingNoNew: "Constructors in/after an Optional Chain are not allowed.",
  OptionalChainingNoTemplate: "Tagged Template Literals are not allowed in optionalChain.",
  OverrideOnConstructor: "'override' modifier cannot appear on a constructor declaration.",
  ParamDupe: "Argument name clash.",
  PatternHasAccessor: "Object pattern can't contain getter or setter.",
  PatternHasMethod: "Object pattern can't contain methods.",
  PrivateInExpectedIn: ({
    identifierName
  }) => `Private names are only allowed in property accesses (\`obj.#${identifierName}\`) or in \`in\` expressions (\`#${identifierName} in obj\`).`,
  PrivateNameRedeclaration: ({
    identifierName
  }) => `Duplicate private name #${identifierName}.`,
  RestTrailingComma: "Unexpected trailing comma after rest element.",
  SloppyFunction: "In non-strict mode code, functions can only be declared at top level or inside a block.",
  SloppyFunctionAnnexB: "In non-strict mode code, functions can only be declared at top level, inside a block, or as the body of an if statement.",
  SourcePhaseImportRequiresDefault: 'Only `import source x from "./module"` is valid.',
  StaticPrototype: "Classes may not have static property named prototype.",
  SuperCallNotNewExpression: "Cannot use new with super(...).",
  SuperNotAllowed: "`super()` is only valid inside a class constructor of a subclass. Maybe a typo in the method name ('constructor') or not extending another class?",
  SuperPrivateField: "Private fields can't be accessed on super.",
  TrailingDecorator: "Decorators must be attached to a class element.",
  UnexpectedArgumentPlaceholder: "Unexpected argument placeholder.",
  UnexpectedDigitAfterHash: "Unexpected digit after hash token.",
  UnexpectedImportExport: "'import' and 'export' may only appear at the top level.",
  UnexpectedKeyword: ({
    keyword
  }) => `Unexpected keyword '${keyword}'.`,
  UnexpectedLeadingDecorator: "Leading decorators must be attached to a class declaration.",
  UnexpectedLexicalDeclaration: "Lexical declaration cannot appear in a single-statement context.",
  UnexpectedNewTarget: "`new.target` can only be used in functions or class properties.",
  UnexpectedNumericSeparator: "A numeric separator is only allowed between two digits.",
  UnexpectedPrivateField: "Unexpected private name.",
  UnexpectedReservedWord: ({
    reservedWord
  }) => `Unexpected reserved word '${reservedWord}'.`,
  UnexpectedSuper: "'super' is only allowed in object methods and classes.",
  UnexpectedToken: ({
    expected,
    unexpected
  }) => `Unexpected token${unexpected ? ` '${unexpected}'.` : ""}${expected ? `, expected "${expected}"` : ""}`,
  UnexpectedTokenUnaryExponentiation: "Illegal expression. Wrap left hand side or entire exponentiation in parentheses.",
  UnexpectedUsingDeclaration: "Using declaration cannot appear in the top level when source type is `script` or in the bare case statement.",
  UnexpectedVoidPattern: "Unexpected void binding.",
  UnsupportedDecoratorExport: "A decorated export must export a class declaration.",
  UnsupportedDefaultExport: "Only expressions, functions or classes are allowed as the `default` export.",
  UnsupportedImport: "`import` can only be used in `import()` or `import.meta`.",
  UnsupportedMetaProperty: ({
    target,
    onlyValidPropertyName
  }) => `The only valid meta property for ${target} is ${target}.${onlyValidPropertyName}.`,
  UnsupportedParameterDecorator: "Decorators cannot be used to decorate parameters.",
  UnsupportedPropertyDecorator: "Decorators cannot be used to decorate object literal properties.",
  UnsupportedSuper: "'super' can only be used with function calls (i.e. super()) or in property accesses (i.e. super.prop or super[prop]).",
  UnterminatedComment: "Unterminated comment.",
  UnterminatedRegExp: "Unterminated regular expression.",
  UnterminatedString: "Unterminated string constant.",
  UnterminatedTemplate: "Unterminated template.",
  UsingDeclarationExport: "Using declaration cannot be exported.",
  UsingDeclarationHasBindingPattern: "Using declaration cannot have destructuring patterns.",
  VarRedeclaration: ({
    identifierName
  }) => `Identifier '${identifierName}' has already been declared.`,
  VoidPatternCatchClauseParam: "A void binding can not be the catch clause parameter. Use `try { ... } catch { ... }` if you want to discard the caught error.",
  VoidPatternInitializer: "A void binding may not have an initializer.",
  YieldBindingIdentifier: "Can not use 'yield' as identifier inside a generator.",
  YieldInParameter: "Yield expression is not allowed in formal parameters.",
  YieldNotInGeneratorFunction: "'yield' is only allowed within generator functions.",
  ZeroDigitNumericSeparator: "Numeric separator can not be used after leading 0."
};
var StrictModeErrors = {
  StrictDelete: "Deleting local variable in strict mode.",
  StrictEvalArguments: ({
    referenceName
  }) => `Assigning to '${referenceName}' in strict mode.`,
  StrictEvalArgumentsBinding: ({
    bindingName
  }) => `Binding '${bindingName}' in strict mode.`,
  StrictFunction: "In strict mode code, functions can only be declared at top level or inside a block.",
  StrictNumericEscape: "The only valid numeric escape in strict mode is '\\0'.",
  StrictOctalLiteral: "Legacy octal literals are not allowed in strict mode.",
  StrictWith: "'with' in strict mode."
};
var ParseExpressionErrors = {
  ParseExpressionEmptyInput: "Unexpected parseExpression() input: The input is empty or contains only comments.",
  ParseExpressionExpectsEOF: ({
    unexpected
  }) => `Unexpected parseExpression() input: The input should contain exactly one expression, but the first expression is followed by the unexpected character \`${String.fromCodePoint(unexpected)}\`.`
};
var UnparenthesizedPipeBodyDescriptions = /* @__PURE__ */ new Set(["ArrowFunctionExpression", "AssignmentExpression", "ConditionalExpression", "YieldExpression"]);
var PipelineOperatorErrors = {
  PipeTopicRequiresHackPipes: 'Topic references are only supported when using the `"proposal": "hack"` version of the pipeline proposal.',
  PipeTopicUnbound: "Topic reference is unbound; it must be inside a pipe body.",
  PipeTopicUnconfiguredToken: ({
    token
  }) => `Invalid topic token ${token}. In order to use ${token} as a topic reference, the pipelineOperator plugin must be configured with { "proposal": "hack", "topicToken": "${token}" }.`,
  PipeTopicUnused: "Hack-style pipe body does not contain a topic reference; Hack-style pipes must use topic at least once.",
  PipeUnparenthesizedBody: ({
    type
  }) => `Hack-style pipe body cannot be an unparenthesized ${toNodeDescription({
    type
  })}; please wrap it in parentheses.`,
  PipelineUnparenthesized: "Cannot mix binary operator with solo-await F#-style pipeline. Please wrap the pipeline in parentheses."
};
var FunctionBindErrors = {
  UnsupportedBind: "Binding should be performed on object property.",
  UnsupportedBindRHS: "The right-hand side of binding can not be super or import."
};
function defineHidden(obj, key, value) {
  Object.defineProperty(obj, key, {
    enumerable: false,
    configurable: true,
    value
  });
}
function toParseErrorConstructor({
  toMessage,
  code: code2,
  reasonCode,
  syntaxPlugin
}) {
  const hasMissingPlugin = reasonCode === "MissingPlugin" || reasonCode === "MissingOneOfPlugins";
  return function constructor(loc, pos, details) {
    const error = new SyntaxError();
    error.code = code2;
    error.reasonCode = reasonCode;
    error.loc = loc;
    error.pos = pos;
    error.syntaxPlugin = syntaxPlugin;
    if (hasMissingPlugin) {
      error.missingPlugin = details.missingPlugin;
    }
    defineHidden(error, "clone", function clone(overrides = {}) {
      const {
        line,
        column,
        index = pos
      } = overrides.loc ?? loc;
      return constructor(new Position(line, column), index, {
        ...details,
        ...overrides.details
      });
    });
    defineHidden(error, "details", details);
    Object.defineProperty(error, "message", {
      configurable: true,
      get() {
        const message = `${toMessage(details)} (${loc.line}:${loc.column})`;
        this.message = message;
        return message;
      },
      set(value) {
        Object.defineProperty(this, "message", {
          value,
          writable: true
        });
      }
    });
    return error;
  };
}
function ParseErrorEnum(argument, syntaxPlugin) {
  if (Array.isArray(argument)) {
    return (parseErrorTemplates) => ParseErrorEnum(parseErrorTemplates, argument[0]);
  }
  const ParseErrorConstructors = {};
  for (const reasonCode of Object.keys(argument)) {
    const template = argument[reasonCode];
    const {
      message,
      ...rest
    } = typeof template === "string" ? {
      message: () => template
    } : typeof template === "function" ? {
      message: template
    } : template;
    const toMessage = typeof message === "string" ? () => message : message;
    ParseErrorConstructors[reasonCode] = toParseErrorConstructor({
      code: "BABEL_PARSER_SYNTAX_ERROR",
      reasonCode,
      toMessage,
      ...syntaxPlugin ? {
        syntaxPlugin
      } : {},
      ...rest
    });
  }
  return ParseErrorConstructors;
}
var Errors = {
  ...ParseErrorEnum(ModuleErrors),
  ...ParseErrorEnum(StandardErrors),
  ...ParseErrorEnum(StrictModeErrors),
  ...ParseErrorEnum(ParseExpressionErrors),
  ...ParseErrorEnum`pipelineOperator`(PipelineOperatorErrors),
  ...ParseErrorEnum`functionBind`(FunctionBindErrors)
};
function createDefaultOptions() {
  return {
    sourceType: "script",
    sourceFilename: void 0,
    startIndex: 0,
    startColumn: 0,
    startLine: 1,
    allowAwaitOutsideFunction: false,
    allowReturnOutsideFunction: false,
    allowNewTargetOutsideFunction: false,
    allowImportExportEverywhere: false,
    allowSuperOutsideMethod: false,
    allowUndeclaredExports: false,
    allowYieldOutsideFunction: false,
    plugins: [],
    strictMode: void 0,
    ranges: false,
    locations: true,
    tokens: false,
    createImportExpressions: true,
    createParenthesizedExpressions: false,
    errorRecovery: false,
    attachComment: true,
    annexB: true
  };
}
function getOptions(opts) {
  const options = createDefaultOptions();
  if (opts == null) {
    return options;
  }
  if (opts.annexB != null && opts.annexB !== false) {
    throw new Error("The `annexB` option can only be set to `false`.");
  }
  for (const key of Object.keys(options)) {
    if (opts[key] != null) options[key] = opts[key];
  }
  if (options.startLine === 1) {
    if (opts.startIndex == null && options.startColumn > 0) {
      options.startIndex = options.startColumn;
    } else if (opts.startColumn == null && options.startIndex > 0) {
      options.startColumn = options.startIndex;
    }
  } else if (opts.startColumn == null || opts.startIndex == null) {
    throw new Error("With a `startLine > 1` you must also specify `startIndex` and `startColumn`.");
  }
  if (options.sourceType === "commonjs") {
    if (opts.allowAwaitOutsideFunction != null) {
      throw new Error("The `allowAwaitOutsideFunction` option cannot be used with `sourceType: 'commonjs'`.");
    }
    if (opts.allowReturnOutsideFunction != null) {
      throw new Error("`sourceType: 'commonjs'` implies `allowReturnOutsideFunction: true`, please remove the `allowReturnOutsideFunction` option or use `sourceType: 'script'`.");
    }
    if (opts.allowNewTargetOutsideFunction != null) {
      throw new Error("`sourceType: 'commonjs'` implies `allowNewTargetOutsideFunction: true`, please remove the `allowNewTargetOutsideFunction` option or use `sourceType: 'script'`.");
    }
  }
  return options;
}
function toESTreeLocation(node) {
  const {
    start,
    end
  } = node.loc;
  node.loc.start = new Position(start.line, start.column);
  node.loc.end = new Position(end.line, end.column);
  return node;
}
var estree = (superClass) => class ESTreeParserMixin extends superClass {
  createPosition(loc) {
    return new Position(loc.line, loc.column);
  }
  parse() {
    const file = super.parse();
    if (this.optionFlags & 512) {
      file.tokens = file.tokens.map(toESTreeLocation);
    }
    return toESTreeLocation(file);
  }
  parseRegExpLiteral({
    pattern: pattern2,
    flags
  }) {
    let regex = null;
    try {
      regex = new RegExp(pattern2, flags);
    } catch (_) {
    }
    const node = this.estreeParseLiteral(regex);
    node.regex = {
      pattern: pattern2,
      flags
    };
    return node;
  }
  parseBigIntLiteral(value) {
    let bigInt;
    try {
      bigInt = BigInt(value);
    } catch {
      bigInt = null;
    }
    const node = this.estreeParseLiteral(bigInt);
    node.bigint = String(node.value || value);
    return node;
  }
  estreeParseLiteral(value) {
    return this.parseLiteral(value, "Literal");
  }
  parseStringLiteral(value) {
    return this.estreeParseLiteral(value);
  }
  parseNumericLiteral(value) {
    return this.estreeParseLiteral(value);
  }
  parseNullLiteral() {
    return this.estreeParseLiteral(null);
  }
  parseBooleanLiteral(value) {
    return this.estreeParseLiteral(value);
  }
  estreeParseChainExpression(node, endNode) {
    const chain = this.startNodeAtNode(node);
    chain.expression = node;
    return this.finishNodeAtNode(chain, "ChainExpression", endNode);
  }
  directiveToStmt(directive) {
    const expression = directive.value;
    delete directive.value;
    this.castNodeTo(expression, "Literal");
    expression.raw = expression.extra.raw;
    expression.value = expression.extra.expressionValue;
    const stmt = this.castNodeTo(directive, "ExpressionStatement");
    stmt.expression = expression;
    stmt.directive = expression.extra.rawValue;
    delete expression.extra;
    return stmt;
  }
  fillOptionalPropertiesForTSESLint(node) {
  }
  cloneEstreeStringLiteral(node) {
    const {
      start,
      end,
      loc,
      range,
      raw,
      value
    } = node;
    const cloned = Object.create(node.constructor.prototype);
    cloned.type = "Literal";
    cloned.start = start;
    cloned.end = end;
    cloned.loc = loc;
    cloned.range = range;
    cloned.raw = raw;
    cloned.value = value;
    return cloned;
  }
  initFunction(node, isAsync) {
    super.initFunction(node, isAsync);
    node.expression = false;
  }
  checkDeclaration(node) {
    if (node != null && this.isObjectProperty(node)) {
      this.checkDeclaration(node.value);
    } else {
      super.checkDeclaration(node);
    }
  }
  getObjectOrClassMethodParams(method) {
    return method.value.params;
  }
  isValidDirective(stmt) {
    return stmt.type === "ExpressionStatement" && stmt.expression.type === "Literal" && typeof stmt.expression.value === "string" && !stmt.expression.extra?.parenthesized;
  }
  parseBlockBody(node, allowDirectives, topLevel, end, afterBlockParse) {
    super.parseBlockBody(node, allowDirectives, topLevel, end, afterBlockParse);
    const directiveStatements = node.directives.map((d) => this.directiveToStmt(d));
    node.body = directiveStatements.concat(node.body);
    delete node.directives;
  }
  parsePrivateName() {
    const node = super.parsePrivateName();
    return this.convertPrivateNameToPrivateIdentifier(node);
  }
  convertPrivateNameToPrivateIdentifier(node) {
    const name = super.getPrivateNameSV(node);
    delete node.id;
    node.name = name;
    return this.castNodeTo(node, "PrivateIdentifier");
  }
  isPrivateName(node) {
    return node.type === "PrivateIdentifier";
  }
  getPrivateNameSV(node) {
    return node.name;
  }
  parseLiteral(value, type) {
    const node = super.parseLiteral(value, type);
    node.raw = node.extra.raw;
    delete node.extra;
    return node;
  }
  parseFunctionBody(node, allowExpression, isMethod = false) {
    super.parseFunctionBody(node, allowExpression, isMethod);
    node.expression = node.body.type !== "BlockStatement";
  }
  parseMethod(node, isGenerator, isAsync, isConstructor, allowDirectSuper, type, inClassScope = false) {
    let funcNode = this.startNode();
    funcNode.kind = node.kind;
    funcNode = super.parseMethod(funcNode, isGenerator, isAsync, isConstructor, allowDirectSuper, type, inClassScope);
    delete funcNode.kind;
    const {
      typeParameters
    } = node;
    if (typeParameters) {
      delete node.typeParameters;
      funcNode.typeParameters = typeParameters;
      this.resetStartLocationFromNode(funcNode, typeParameters);
    }
    const valueNode = this.castNodeTo(funcNode, this.hasPlugin("typescript") && !funcNode.body ? "TSEmptyBodyFunctionExpression" : "FunctionExpression");
    node.value = valueNode;
    if (type === "ClassPrivateMethod") {
      node.computed = false;
    }
    if (this.hasPlugin("typescript")) {
      if (node.abstract) {
        delete node.abstract;
        return this.finishNode(node, "TSAbstractMethodDefinition");
      }
    }
    if (type === "ObjectMethod") {
      if (node.kind === "method") {
        node.kind = "init";
      }
      node.shorthand = false;
      return this.finishNode(node, "Property");
    } else {
      return this.finishNode(node, "MethodDefinition");
    }
  }
  nameIsConstructor(key) {
    if (key.type === "Literal") return key.value === "constructor";
    return super.nameIsConstructor(key);
  }
  parseClassProperty(...args) {
    const propertyNode = super.parseClassProperty(...args);
    if (propertyNode.abstract && this.hasPlugin("typescript")) {
      delete propertyNode.abstract;
      this.castNodeTo(propertyNode, "TSAbstractPropertyDefinition");
    } else {
      this.castNodeTo(propertyNode, "PropertyDefinition");
    }
    return propertyNode;
  }
  parseClassPrivateProperty(...args) {
    const propertyNode = super.parseClassPrivateProperty(...args);
    if (propertyNode.abstract && this.hasPlugin("typescript")) {
      this.castNodeTo(propertyNode, "TSAbstractPropertyDefinition");
    } else {
      this.castNodeTo(propertyNode, "PropertyDefinition");
    }
    propertyNode.computed = false;
    return propertyNode;
  }
  parseClassAccessorProperty(node) {
    const accessorPropertyNode = super.parseClassAccessorProperty(node);
    if (accessorPropertyNode.abstract && this.hasPlugin("typescript")) {
      delete accessorPropertyNode.abstract;
      this.castNodeTo(accessorPropertyNode, "TSAbstractAccessorProperty");
    } else {
      this.castNodeTo(accessorPropertyNode, "AccessorProperty");
    }
    return accessorPropertyNode;
  }
  parseObjectProperty(prop, startLoc, isPattern, refExpressionErrors) {
    const node = super.parseObjectProperty(prop, startLoc, isPattern, refExpressionErrors);
    if (node) {
      node.kind = "init";
      this.castNodeTo(node, "Property");
    }
    return node;
  }
  finishObjectProperty(node) {
    node.kind = "init";
    return this.finishNode(node, "Property");
  }
  isValidLVal(type, disallowCallExpression, isUnparenthesizedInAssign, binding) {
    return type === "Property" ? "value" : super.isValidLVal(type, disallowCallExpression, isUnparenthesizedInAssign, binding);
  }
  isAssignable(node, isBinding) {
    if (node != null && this.isObjectProperty(node)) {
      return this.isAssignable(node.value, isBinding);
    }
    return super.isAssignable(node, isBinding);
  }
  toAssignable(node, isLHS = false) {
    if (node != null && this.isObjectProperty(node)) {
      const {
        key,
        value
      } = node;
      if (this.isPrivateName(key)) {
        this.classScope.usePrivateName(this.getPrivateNameSV(key), key.start);
      }
      this.toAssignable(value, isLHS);
    } else {
      super.toAssignable(node, isLHS);
    }
  }
  toAssignableObjectExpressionProp(prop, isLast, isLHS) {
    if (prop.type === "Property" && (prop.kind === "get" || prop.kind === "set")) {
      this.raise(Errors.PatternHasAccessor, prop.key);
    } else if (prop.type === "Property" && prop.method) {
      this.raise(Errors.PatternHasMethod, prop.key);
    } else {
      super.toAssignableObjectExpressionProp(prop, isLast, isLHS);
    }
  }
  finishCallExpression(unfinished, optional) {
    const node = super.finishCallExpression(unfinished, optional);
    if (node.callee.type === "Import") {
      this.castNodeTo(node, "ImportExpression");
      node.source = node.arguments[0];
      node.options = node.arguments[1] ?? null;
      delete node.arguments;
      delete node.callee;
    } else if (node.type === "OptionalCallExpression") {
      this.castNodeTo(node, "CallExpression");
    } else {
      node.optional = false;
    }
    return node;
  }
  parseExport(unfinished, decorators) {
    const exportStartLoc = this.state.lastTokStartLoc;
    const node = super.parseExport(unfinished, decorators);
    switch (node.type) {
      case "ExportAllDeclaration":
        node.exported = null;
        break;
      case "ExportNamedDeclaration":
        if (node.specifiers.length === 1 && node.specifiers[0].type === "ExportNamespaceSpecifier") {
          this.castNodeTo(node, "ExportAllDeclaration");
          node.exported = node.specifiers[0].exported;
          delete node.specifiers;
        }
      case "ExportDefaultDeclaration":
        {
          const {
            declaration
          } = node;
          if (declaration?.type === "ClassDeclaration" && declaration.decorators?.length > 0 && declaration.start === node.start) {
            this.resetStartLocation(node, exportStartLoc);
          }
        }
        break;
    }
    return node;
  }
  stopParseSubscript(base, state) {
    const node = super.stopParseSubscript(base, state);
    if (state.optionalChainMember) {
      return this.estreeParseChainExpression(node, base);
    }
    return node;
  }
  parseMember(base, startLoc, state, computed, optional) {
    const node = super.parseMember(base, startLoc, state, computed, optional);
    if (node.type === "OptionalMemberExpression") {
      this.castNodeTo(node, "MemberExpression");
    } else {
      node.optional = false;
    }
    return node;
  }
  isOptionalMemberExpression(node) {
    if (node.type === "ChainExpression") {
      return node.expression.type === "MemberExpression";
    }
    return super.isOptionalMemberExpression(node);
  }
  hasPropertyAsPrivateName(node) {
    if (node.type === "ChainExpression") {
      node = node.expression;
    }
    return super.hasPropertyAsPrivateName(node);
  }
  isObjectProperty(node) {
    return node.type === "Property" && node.kind === "init" && !node.method;
  }
  isObjectMethod(node) {
    return node.type === "Property" && (node.method || node.kind === "get" || node.kind === "set");
  }
  castNodeTo(node, type) {
    const result = super.castNodeTo(node, type);
    this.fillOptionalPropertiesForTSESLint(result);
    return result;
  }
  cloneIdentifier(node) {
    const cloned = super.cloneIdentifier(node);
    this.fillOptionalPropertiesForTSESLint(cloned);
    return cloned;
  }
  cloneStringLiteral(node) {
    if (node.type === "Literal") {
      return this.cloneEstreeStringLiteral(node);
    }
    return super.cloneStringLiteral(node);
  }
  finishNodeAt(node, type, endLoc) {
    return toESTreeLocation(super.finishNodeAt(node, type, endLoc));
  }
  finishNodeAtNode(node, type, endNode) {
    return toESTreeLocation(super.finishNodeAtNode(node, type, endNode));
  }
  finishNode(node, type) {
    const result = super.finishNode(node, type);
    this.fillOptionalPropertiesForTSESLint(result);
    return result;
  }
  resetStartLocation(node, startLoc) {
    super.resetStartLocation(node, startLoc);
    toESTreeLocation(node);
  }
  resetEndLocation(node, endLoc = this.state.lastTokEndLoc) {
    super.resetEndLocation(node, endLoc);
    toESTreeLocation(node);
  }
};
var beforeExpr = true;
var startsExpr = true;
var isLoop = true;
var isAssign = true;
var prefix = true;
var postfix = true;
var ExportedTokenType = class {
  label;
  keyword;
  beforeExpr;
  startsExpr;
  rightAssociative;
  isLoop;
  isAssign;
  prefix;
  postfix;
  binop;
  constructor(label, conf = {}) {
    this.label = label;
    this.keyword = conf.keyword;
    this.beforeExpr = !!conf.beforeExpr;
    this.startsExpr = !!conf.startsExpr;
    this.rightAssociative = !!conf.rightAssociative;
    this.isLoop = !!conf.isLoop;
    this.isAssign = !!conf.isAssign;
    this.prefix = !!conf.prefix;
    this.postfix = !!conf.postfix;
    this.binop = conf.binop != null ? conf.binop : null;
  }
};
var keywords$1 = /* @__PURE__ */ new Map();
function createKeyword(name, options = {}) {
  options.keyword = name;
  const token = createToken(name, options);
  keywords$1.set(name, token);
  return token;
}
function createBinop(name, binop) {
  return createToken(name, {
    beforeExpr,
    binop
  });
}
var tokenTypeCounter = -1;
var tokenTypes = [];
var tokenLabels = [];
var tokenBinops = [];
var tokenBeforeExprs = [];
var tokenStartsExprs = [];
var tokenPrefixes = [];
function createToken(name, options = {}) {
  ++tokenTypeCounter;
  tokenLabels.push(name);
  tokenBinops.push(options.binop ?? -1);
  tokenBeforeExprs.push(options.beforeExpr ?? false);
  tokenStartsExprs.push(options.startsExpr ?? false);
  tokenPrefixes.push(options.prefix ?? false);
  tokenTypes.push(new ExportedTokenType(name, options));
  return tokenTypeCounter;
}
function createKeywordLike(name, options = {}) {
  ++tokenTypeCounter;
  keywords$1.set(name, tokenTypeCounter);
  tokenLabels.push(name);
  tokenBinops.push(options.binop ?? -1);
  tokenBeforeExprs.push(options.beforeExpr ?? false);
  tokenStartsExprs.push(options.startsExpr ?? false);
  tokenPrefixes.push(options.prefix ?? false);
  tokenTypes.push(new ExportedTokenType("name", options));
  return tokenTypeCounter;
}
var tt = {
  bracketL: createToken("[", {
    beforeExpr,
    startsExpr
  }),
  bracketR: createToken("]"),
  braceL: createToken("{", {
    beforeExpr,
    startsExpr
  }),
  braceBarL: createToken("{|", {
    beforeExpr,
    startsExpr
  }),
  braceR: createToken("}"),
  braceBarR: createToken("|}"),
  parenL: createToken("(", {
    beforeExpr,
    startsExpr
  }),
  parenR: createToken(")"),
  comma: createToken(",", {
    beforeExpr
  }),
  semi: createToken(";", {
    beforeExpr
  }),
  colon: createToken(":", {
    beforeExpr
  }),
  doubleColon: createToken("::", {
    beforeExpr
  }),
  dot: createToken("."),
  question: createToken("?", {
    beforeExpr
  }),
  questionDot: createToken("?."),
  arrow: createToken("=>", {
    beforeExpr
  }),
  template: createToken("template"),
  ellipsis: createToken("...", {
    beforeExpr
  }),
  backQuote: createToken("`", {
    startsExpr
  }),
  dollarBraceL: createToken("${", {
    beforeExpr,
    startsExpr
  }),
  templateTail: createToken("...`", {
    startsExpr
  }),
  templateNonTail: createToken("...${", {
    beforeExpr,
    startsExpr
  }),
  at: createToken("@"),
  hash: createToken("#", {
    startsExpr
  }),
  interpreterDirective: createToken("#!..."),
  eq: createToken("=", {
    beforeExpr,
    isAssign
  }),
  assign: createToken("_=", {
    beforeExpr,
    isAssign
  }),
  slashAssign: createToken("_=", {
    beforeExpr,
    isAssign
  }),
  xorAssign: createToken("_=", {
    beforeExpr,
    isAssign
  }),
  moduloAssign: createToken("_=", {
    beforeExpr,
    isAssign
  }),
  incDec: createToken("++/--", {
    prefix,
    postfix,
    startsExpr
  }),
  bang: createToken("!", {
    beforeExpr,
    prefix,
    startsExpr
  }),
  tilde: createToken("~", {
    beforeExpr,
    prefix,
    startsExpr
  }),
  doubleCaret: createToken("^^", {
    startsExpr
  }),
  doubleAt: createToken("@@", {
    startsExpr
  }),
  pipeline: createBinop("|>", 0),
  nullishCoalescing: createBinop("??", 1),
  logicalOR: createBinop("||", 1),
  logicalAND: createBinop("&&", 2),
  bitwiseOR: createBinop("|", 3),
  bitwiseXOR: createBinop("^", 4),
  bitwiseAND: createBinop("&", 5),
  equality: createBinop("==/!=/===/!==", 6),
  lt: createBinop("</>/<=/>=", 7),
  gt: createBinop("</>/<=/>=", 7),
  relational: createBinop("</>/<=/>=", 7),
  bitShift: createBinop("<</>>/>>>", 8),
  bitShiftL: createBinop("<</>>/>>>", 8),
  bitShiftR: createBinop("<</>>/>>>", 8),
  plusMin: createToken("+/-", {
    beforeExpr,
    binop: 9,
    prefix,
    startsExpr
  }),
  modulo: createToken("%", {
    binop: 10,
    startsExpr
  }),
  star: createToken("*", {
    binop: 10
  }),
  slash: createBinop("/", 10),
  exponent: createToken("**", {
    beforeExpr,
    binop: 11,
    rightAssociative: true
  }),
  _in: createKeyword("in", {
    beforeExpr,
    binop: 7
  }),
  _instanceof: createKeyword("instanceof", {
    beforeExpr,
    binop: 7
  }),
  _break: createKeyword("break"),
  _case: createKeyword("case", {
    beforeExpr
  }),
  _catch: createKeyword("catch"),
  _continue: createKeyword("continue"),
  _debugger: createKeyword("debugger"),
  _default: createKeyword("default", {
    beforeExpr
  }),
  _else: createKeyword("else", {
    beforeExpr
  }),
  _finally: createKeyword("finally"),
  _function: createKeyword("function", {
    startsExpr
  }),
  _if: createKeyword("if"),
  _return: createKeyword("return", {
    beforeExpr
  }),
  _switch: createKeyword("switch"),
  _throw: createKeyword("throw", {
    beforeExpr,
    prefix,
    startsExpr
  }),
  _try: createKeyword("try"),
  _var: createKeyword("var"),
  _const: createKeyword("const"),
  _with: createKeyword("with"),
  _new: createKeyword("new", {
    beforeExpr,
    startsExpr
  }),
  _this: createKeyword("this", {
    startsExpr
  }),
  _super: createKeyword("super", {
    startsExpr
  }),
  _class: createKeyword("class", {
    startsExpr
  }),
  _extends: createKeyword("extends", {
    beforeExpr
  }),
  _export: createKeyword("export"),
  _import: createKeyword("import", {
    startsExpr
  }),
  _null: createKeyword("null", {
    startsExpr
  }),
  _true: createKeyword("true", {
    startsExpr
  }),
  _false: createKeyword("false", {
    startsExpr
  }),
  _typeof: createKeyword("typeof", {
    beforeExpr,
    prefix,
    startsExpr
  }),
  _void: createKeyword("void", {
    beforeExpr,
    prefix,
    startsExpr
  }),
  _delete: createKeyword("delete", {
    beforeExpr,
    prefix,
    startsExpr
  }),
  _do: createKeyword("do", {
    isLoop,
    beforeExpr
  }),
  _for: createKeyword("for", {
    isLoop
  }),
  _while: createKeyword("while", {
    isLoop
  }),
  _as: createKeywordLike("as", {
    startsExpr
  }),
  _assert: createKeywordLike("assert", {
    startsExpr
  }),
  _async: createKeywordLike("async", {
    startsExpr
  }),
  _await: createKeywordLike("await", {
    startsExpr
  }),
  _defer: createKeywordLike("defer", {
    startsExpr
  }),
  _from: createKeywordLike("from", {
    startsExpr
  }),
  _get: createKeywordLike("get", {
    startsExpr
  }),
  _let: createKeywordLike("let", {
    startsExpr
  }),
  _meta: createKeywordLike("meta", {
    startsExpr
  }),
  _of: createKeywordLike("of", {
    startsExpr
  }),
  _sent: createKeywordLike("sent", {
    startsExpr
  }),
  _set: createKeywordLike("set", {
    startsExpr
  }),
  _source: createKeywordLike("source", {
    startsExpr
  }),
  _static: createKeywordLike("static", {
    startsExpr
  }),
  _using: createKeywordLike("using", {
    startsExpr
  }),
  _yield: createKeywordLike("yield", {
    startsExpr
  }),
  _asserts: createKeywordLike("asserts", {
    startsExpr
  }),
  _checks: createKeywordLike("checks", {
    startsExpr
  }),
  _exports: createKeywordLike("exports", {
    startsExpr
  }),
  _global: createKeywordLike("global", {
    startsExpr
  }),
  _implements: createKeywordLike("implements", {
    startsExpr
  }),
  _intrinsic: createKeywordLike("intrinsic", {
    startsExpr
  }),
  _infer: createKeywordLike("infer", {
    startsExpr
  }),
  _is: createKeywordLike("is", {
    startsExpr
  }),
  _mixins: createKeywordLike("mixins", {
    startsExpr
  }),
  _proto: createKeywordLike("proto", {
    startsExpr
  }),
  _require: createKeywordLike("require", {
    startsExpr
  }),
  _satisfies: createKeywordLike("satisfies", {
    startsExpr
  }),
  _keyof: createKeywordLike("keyof", {
    startsExpr
  }),
  _readonly: createKeywordLike("readonly", {
    startsExpr
  }),
  _unique: createKeywordLike("unique", {
    startsExpr
  }),
  _abstract: createKeywordLike("abstract", {
    startsExpr
  }),
  _declare: createKeywordLike("declare", {
    startsExpr
  }),
  _enum: createKeywordLike("enum", {
    startsExpr
  }),
  _module: createKeywordLike("module", {
    startsExpr
  }),
  _namespace: createKeywordLike("namespace", {
    startsExpr
  }),
  _interface: createKeywordLike("interface", {
    startsExpr
  }),
  _type: createKeywordLike("type", {
    startsExpr
  }),
  _opaque: createKeywordLike("opaque", {
    startsExpr
  }),
  name: createToken("name", {
    startsExpr
  }),
  placeholder: createToken("%%", {
    startsExpr
  }),
  string: createToken("string", {
    startsExpr
  }),
  num: createToken("num", {
    startsExpr
  }),
  bigint: createToken("bigint", {
    startsExpr
  }),
  regexp: createToken("regexp", {
    startsExpr
  }),
  privateName: createToken("#name", {
    startsExpr
  }),
  eof: createToken("eof"),
  jsxName: createToken("jsxName"),
  jsxText: createToken("jsxText", {
    beforeExpr
  }),
  jsxTagStart: createToken("jsxTagStart", {
    startsExpr
  }),
  jsxTagEnd: createToken("jsxTagEnd")
};
function tokenIsIdentifier(token) {
  return token >= 89 && token <= 129;
}
function tokenKeywordOrIdentifierIsKeyword(token) {
  return token <= 88;
}
function tokenIsKeywordOrIdentifier(token) {
  return token >= 54 && token <= 129;
}
function tokenIsLiteralPropertyName(token) {
  return token >= 54 && token <= 132;
}
function tokenComesBeforeExpression(token) {
  return tokenBeforeExprs[token];
}
function tokenCanStartExpression(token) {
  return tokenStartsExprs[token];
}
function tokenIsAssignment(token) {
  return token >= 25 && token <= 29;
}
function tokenIsFlowInterfaceOrTypeOrOpaque(token) {
  return token >= 125 && token <= 127;
}
function tokenIsLoop(token) {
  return token >= 86 && token <= 88;
}
function tokenIsKeyword(token) {
  return token >= 54 && token <= 88;
}
function tokenIsOperator(token) {
  return token >= 35 && token <= 55;
}
function tokenIsPostfix(token) {
  return token === 30;
}
function tokenIsPrefix(token) {
  return tokenPrefixes[token];
}
function tokenIsTSTypeOperator(token) {
  return token >= 117 && token <= 119;
}
function tokenIsTSDeclarationStart(token) {
  return token >= 120 && token <= 126;
}
function tokenLabelName(token) {
  return tokenLabels[token];
}
function tokenOperatorPrecedence(token) {
  return tokenBinops[token];
}
function tokenIsRightAssociative(token) {
  return token === 53;
}
function tokenIsTemplate(token) {
  return token >= 20 && token <= 21;
}
function getExportedToken(token) {
  return tokenTypes[token];
}
var TokContext = class {
  constructor(token, preserveSpace) {
    this.token = token;
    this.preserveSpace = !!preserveSpace;
  }
  token;
  preserveSpace;
};
var types = {
  brace: new TokContext("{"),
  j_oTag: new TokContext("<tag"),
  j_cTag: new TokContext("</tag"),
  j_expr: new TokContext("<tag>...</tag>", true)
};
var bmpIdentifierStart = /[\p{ID_Start}\u088f\u0c5c\u0cdc\ua7ce\ua7cf\ua7d2\ua7d4\ua7f1]/u;
var bmpIdentifier = /[\p{ID_Continue}\u088f\u0c5c\u0cdc\ua7ce\ua7cf\ua7d2\ua7d4\ua7f1\u1acf-\u1add\u1ae0-\u1aeb]/u;
var supplementaryIdentifierStartCodes = [2368, 25, 1388, 2, 3817, 43, 20677, 24, 3, 24, 287, 4, 6146, 7, 1290, 21, 98, 114, 22734, 30, 2, 2, 2, 1, 2, 6, 3, 4, 10, 1, 53307, 5, 5987, 11, 21763, 4297];
var supplementaryIdentifierCodes = [3834, 1, 3173, 7, 633, 9, 51450, 0, 3, 0, 8, 1, 6, 0];
function isInSupplementarySet(code2, set) {
  let pos = 65536;
  for (let i = 0, length = set.length; i < length; i += 2) {
    pos += set[i];
    if (pos > code2) return false;
    pos += set[i + 1];
    if (pos >= code2) return true;
  }
  return false;
}
function isIdentifierStart(code2) {
  if (code2 < 65) return code2 === 36;
  if (code2 <= 90) return true;
  if (code2 < 97) return code2 === 95;
  if (code2 <= 122) return true;
  if (code2 <= 65535) {
    return code2 >= 170 && bmpIdentifierStart.test(String.fromCharCode(code2));
  }
  return !isNaN(code2) && code2 <= 1114111 && (bmpIdentifierStart.test(String.fromCodePoint(code2)) || isInSupplementarySet(code2, supplementaryIdentifierStartCodes));
}
function isIdentifierChar(code2) {
  if (code2 < 48) return code2 === 36;
  if (code2 < 58) return true;
  if (code2 < 65) return false;
  if (code2 <= 90) return true;
  if (code2 < 97) return code2 === 95;
  if (code2 <= 122) return true;
  if (code2 <= 65535) {
    return code2 >= 170 && bmpIdentifier.test(String.fromCharCode(code2));
  }
  return !isNaN(code2) && code2 <= 1114111 && (bmpIdentifier.test(String.fromCodePoint(code2)) || isInSupplementarySet(code2, supplementaryIdentifierStartCodes) || isInSupplementarySet(code2, supplementaryIdentifierCodes));
}
var reservedWords = {
  keyword: ["break", "case", "catch", "continue", "debugger", "default", "do", "else", "finally", "for", "function", "if", "return", "switch", "throw", "try", "var", "const", "while", "with", "new", "this", "super", "class", "extends", "export", "import", "null", "true", "false", "in", "instanceof", "typeof", "void", "delete"],
  strict: ["implements", "interface", "let", "package", "private", "protected", "public", "static", "yield"],
  strictBind: ["eval", "arguments"]
};
var keywords = new Set(reservedWords.keyword);
var reservedWordsStrictSet = new Set(reservedWords.strict);
var reservedWordsStrictBindSet = new Set(reservedWords.strictBind);
function isReservedWord(word, inModule) {
  return inModule && word === "await" || word === "enum";
}
function isStrictReservedWord(word, inModule) {
  return isReservedWord(word, inModule) || reservedWordsStrictSet.has(word);
}
function isStrictBindOnlyReservedWord(word) {
  return reservedWordsStrictBindSet.has(word);
}
function isStrictBindReservedWord(word, inModule) {
  return isStrictReservedWord(word, inModule) || isStrictBindOnlyReservedWord(word);
}
function isKeyword(word) {
  return keywords.has(word);
}
function isIteratorStart(current, next, next2) {
  return current === 64 && next === 64 && isIdentifierStart(next2);
}
var reservedWordLikeSet = /* @__PURE__ */ new Set(["break", "case", "catch", "continue", "debugger", "default", "do", "else", "finally", "for", "function", "if", "return", "switch", "throw", "try", "var", "const", "while", "with", "new", "this", "super", "class", "extends", "export", "import", "null", "true", "false", "in", "instanceof", "typeof", "void", "delete", "implements", "interface", "let", "package", "private", "protected", "public", "static", "yield", "eval", "arguments", "enum", "await"]);
function canBeReservedWord(word) {
  return reservedWordLikeSet.has(word);
}
var Scope = class {
  flags = 0;
  names = /* @__PURE__ */ new Map();
  firstLexicalName = "";
  constructor(flags) {
    this.flags = flags;
  }
};
var ScopeHandler = class {
  parser;
  scopeStack = [];
  inModule;
  undefinedExports = /* @__PURE__ */ new Map();
  constructor(parser, inModule) {
    this.parser = parser;
    this.inModule = inModule;
  }
  get inTopLevel() {
    return (this.currentScope().flags & 1) > 0;
  }
  get inFunction() {
    return (this.currentVarScopeFlags() & 2) > 0;
  }
  get allowSuper() {
    return (this.currentThisScopeFlags() & 16) > 0;
  }
  get allowDirectSuper() {
    return (this.currentThisScopeFlags() & 32) > 0;
  }
  get allowNewTarget() {
    return (this.currentThisScopeFlags() & 512) > 0;
  }
  get inClass() {
    return (this.currentThisScopeFlags() & 64) > 0;
  }
  get inClassAndNotInNonArrowFunction() {
    const flags = this.currentThisScopeFlags();
    return (flags & 64) > 0 && (flags & 2) === 0;
  }
  get inStaticBlock() {
    for (let i = this.scopeStack.length - 1; ; i--) {
      const {
        flags
      } = this.scopeStack[i];
      if (flags & 128) {
        return true;
      }
      if (flags & (3715 | 64)) {
        return false;
      }
    }
  }
  get inNonArrowFunction() {
    return (this.currentThisScopeFlags() & 2) > 0;
  }
  get inBareCaseStatement() {
    return (this.currentScope().flags & 256) > 0;
  }
  get treatFunctionsAsVar() {
    return this.treatFunctionsAsVarInScope(this.currentScope());
  }
  createScope(flags) {
    return new Scope(flags);
  }
  enter(flags) {
    this.scopeStack.push(this.createScope(flags));
  }
  exit() {
    const scope = this.scopeStack.pop();
    return scope.flags;
  }
  treatFunctionsAsVarInScope(scope) {
    return !!(scope.flags & (2 | 128) || !this.parser.inModule && scope.flags & 1);
  }
  declareName(name, bindingType, loc) {
    let scope = this.currentScope();
    if (bindingType & 8 || bindingType & 16) {
      this.checkRedeclarationInScope(scope, name, bindingType, loc);
      let type = scope.names.get(name) || 0;
      if (bindingType & 16) {
        type = type | 4;
      } else {
        if (!scope.firstLexicalName) {
          scope.firstLexicalName = name;
        }
        type = type | 2;
      }
      scope.names.set(name, type);
      if (bindingType & 8) {
        this.maybeExportDefined(scope, name);
      }
    } else if (bindingType & 4) {
      for (let i = this.scopeStack.length - 1; i >= 0; --i) {
        scope = this.scopeStack[i];
        this.checkRedeclarationInScope(scope, name, bindingType, loc);
        scope.names.set(name, (scope.names.get(name) || 0) | 1);
        this.maybeExportDefined(scope, name);
        if (scope.flags & 3715) break;
      }
    }
    if (this.parser.inModule && scope.flags & 1) {
      this.undefinedExports.delete(name);
    }
  }
  maybeExportDefined(scope, name) {
    if (this.parser.inModule && scope.flags & 1) {
      this.undefinedExports.delete(name);
    }
  }
  checkRedeclarationInScope(scope, name, bindingType, loc) {
    if (this.isRedeclaredInScope(scope, name, bindingType)) {
      this.parser.raise(Errors.VarRedeclaration, loc, {
        identifierName: name
      });
    }
  }
  isRedeclaredInScope(scope, name, bindingType) {
    if (!(bindingType & 1)) return false;
    if (bindingType & 8) {
      return scope.names.has(name);
    }
    const type = scope.names.get(name) || 0;
    if (bindingType & 16) {
      return (type & 2) > 0 || !this.treatFunctionsAsVarInScope(scope) && (type & 1) > 0;
    }
    return (type & 2) > 0 && !(scope.flags & 8 && scope.firstLexicalName === name) || !this.treatFunctionsAsVarInScope(scope) && (type & 4) > 0;
  }
  checkLocalExport(id) {
    const {
      name
    } = id;
    const topLevelScope = this.scopeStack[0];
    if (!topLevelScope.names.has(name)) {
      this.undefinedExports.set(name, id.start);
    }
  }
  currentScope() {
    return this.scopeStack[this.scopeStack.length - 1];
  }
  currentVarScopeFlags() {
    for (let i = this.scopeStack.length - 1; ; i--) {
      const {
        flags
      } = this.scopeStack[i];
      if (flags & 3715) {
        return flags;
      }
    }
  }
  currentThisScopeFlags() {
    for (let i = this.scopeStack.length - 1; ; i--) {
      const {
        flags
      } = this.scopeStack[i];
      if (flags & (3715 | 64) && !(flags & 4)) {
        return flags;
      }
    }
  }
};
var FlowScope = class extends Scope {
  declareFunctions = /* @__PURE__ */ new Set();
};
var FlowScopeHandler = class extends ScopeHandler {
  createScope(flags) {
    return new FlowScope(flags);
  }
  declareName(name, bindingType, loc) {
    const scope = this.currentScope();
    if (bindingType & 2048) {
      this.checkRedeclarationInScope(scope, name, bindingType, loc);
      this.maybeExportDefined(scope, name);
      scope.declareFunctions.add(name);
      return;
    }
    super.declareName(name, bindingType, loc);
  }
  isRedeclaredInScope(scope, name, bindingType) {
    if (super.isRedeclaredInScope(scope, name, bindingType)) return true;
    if (bindingType & 2048 && !scope.declareFunctions.has(name)) {
      const type = scope.names.get(name);
      return (type & 4) > 0 || (type & 2) > 0;
    }
    return false;
  }
  checkLocalExport(id) {
    if (!this.scopeStack[0].declareFunctions.has(id.name)) {
      super.checkLocalExport(id);
    }
  }
};
var reservedTypes = /* @__PURE__ */ new Set(["_", "any", "bool", "boolean", "empty", "extends", "false", "interface", "mixed", "null", "number", "static", "string", "true", "typeof", "void"]);
var FlowErrorTemplates = {
  AmbiguousConditionalArrow: "Ambiguous expression: wrap the arrow functions in parentheses to disambiguate.",
  AmbiguousDeclareModuleKind: "Found both `declare module.exports` and `declare export` in the same module. Modules can only have 1 since they are either an ES module or they are a CommonJS module.",
  AssignReservedType: ({
    reservedType
  }) => `Cannot overwrite reserved type ${reservedType}.`,
  DeclareClassElement: "The `declare` modifier can only appear on class fields.",
  DeclareClassFieldInitializer: "Initializers are not allowed in fields with the `declare` modifier.",
  DuplicateDeclareModuleExports: "Duplicate `declare module.exports` statement.",
  EnumBooleanMemberNotInitialized: ({
    memberName,
    enumName
  }) => `Boolean enum members need to be initialized. Use either \`${memberName} = true,\` or \`${memberName} = false,\` in enum \`${enumName}\`.`,
  EnumDuplicateMemberName: ({
    memberName,
    enumName
  }) => `Enum member names need to be unique, but the name \`${memberName}\` has already been used before in enum \`${enumName}\`.`,
  EnumInconsistentMemberValues: ({
    enumName
  }) => `Enum \`${enumName}\` has inconsistent member initializers. Either use no initializers, or consistently use literals (either booleans, numbers, or strings) for all member initializers.`,
  EnumInvalidExplicitType: ({
    invalidEnumType,
    enumName
  }) => `Enum type \`${invalidEnumType}\` is not valid. Use one of \`boolean\`, \`number\`, \`string\`, or \`symbol\` in enum \`${enumName}\`.`,
  EnumInvalidExplicitTypeUnknownSupplied: ({
    enumName
  }) => `Supplied enum type is not valid. Use one of \`boolean\`, \`number\`, \`string\`, or \`symbol\` in enum \`${enumName}\`.`,
  EnumInvalidMemberInitializerPrimaryType: ({
    enumName,
    memberName,
    explicitType
  }) => `Enum \`${enumName}\` has type \`${explicitType}\`, so the initializer of \`${memberName}\` needs to be a ${explicitType} literal.`,
  EnumInvalidMemberInitializerSymbolType: ({
    enumName,
    memberName
  }) => `Symbol enum members cannot be initialized. Use \`${memberName},\` in enum \`${enumName}\`.`,
  EnumInvalidMemberInitializerUnknownType: ({
    enumName,
    memberName
  }) => `The enum member initializer for \`${memberName}\` needs to be a literal (either a boolean, number, or string) in enum \`${enumName}\`.`,
  EnumInvalidMemberName: ({
    enumName,
    memberName,
    suggestion
  }) => `Enum member names cannot start with lowercase 'a' through 'z'. Instead of using \`${memberName}\`, consider using \`${suggestion}\`, in enum \`${enumName}\`.`,
  EnumNumberMemberNotInitialized: ({
    enumName,
    memberName
  }) => `Number enum members need to be initialized, e.g. \`${memberName} = 1\` in enum \`${enumName}\`.`,
  EnumStringMemberInconsistentlyInitialized: ({
    enumName
  }) => `String enum members need to consistently either all use initializers, or use no initializers, in enum \`${enumName}\`.`,
  GetterMayNotHaveThisParam: "A getter cannot have a `this` parameter.",
  ImportTypeShorthandOnlyInPureImport: "The `type` and `typeof` keywords on named imports can only be used on regular `import` statements. It cannot be used with `import type` or `import typeof` statements.",
  InexactInsideExact: "Explicit inexact syntax cannot appear inside an explicit exact object type.",
  InexactInsideNonObject: "Explicit inexact syntax cannot appear in class or interface definitions.",
  InexactVariance: "Explicit inexact syntax cannot have variance.",
  InvalidNonTypeImportInDeclareModule: "Imports within a `declare module` body must always be `import type` or `import typeof`.",
  MissingTypeParamDefault: "Type parameter declaration needs a default, since a preceding type parameter declaration has a default.",
  NestedDeclareModule: "`declare module` cannot be used inside another `declare module`.",
  NestedFlowComment: "Cannot have a flow comment inside another flow comment.",
  PatternIsOptional: {
    message: "A binding pattern parameter cannot be optional in an implementation signature."
  },
  SetterMayNotHaveThisParam: "A setter cannot have a `this` parameter.",
  SpreadVariance: "Spread properties cannot have variance.",
  ThisParamAnnotationRequired: "A type annotation is required for the `this` parameter.",
  ThisParamBannedInConstructor: "Constructors cannot have a `this` parameter; constructors don't bind `this` like other functions.",
  ThisParamMayNotBeOptional: "The `this` parameter cannot be optional.",
  ThisParamMustBeFirst: "The `this` parameter must be the first function parameter.",
  ThisParamNoDefault: "The `this` parameter may not have a default value.",
  TypeBeforeInitializer: "Type annotations must come before default assignments, e.g. instead of `age = 25: number` use `age: number = 25`.",
  TypeCastInPattern: "The type cast expression is expected to be wrapped with parenthesis.",
  UnexpectedExplicitInexactInObject: "Explicit inexact syntax must appear at the end of an inexact object.",
  UnexpectedReservedType: ({
    reservedType
  }) => `Unexpected reserved type ${reservedType}.`,
  UnexpectedReservedUnderscore: "`_` is only allowed as a type argument to call or new.",
  UnexpectedSpaceBetweenModuloChecks: "Spaces between `%` and `checks` are not allowed here.",
  UnexpectedSpreadType: "Spread operator cannot appear in class or interface definitions.",
  UnexpectedSubtractionOperand: 'Unexpected token, expected "number" or "bigint".',
  UnexpectedTokenAfterTypeParameter: "Expected an arrow function after this type parameter declaration.",
  UnexpectedTypeParameterBeforeAsyncArrowFunction: "Type parameters must come after the async keyword, e.g. instead of `<T> async () => {}`, use `async <T>() => {}`.",
  UnsupportedDeclareExportKind: ({
    unsupportedExportKind,
    suggestion
  }) => `\`declare export ${unsupportedExportKind}\` is not supported. Use \`${suggestion}\` instead.`,
  UnsupportedStatementInDeclareModule: "Only declares and type imports are allowed inside declare module.",
  UnterminatedFlowComment: "Unterminated flow-comment."
};
var FlowErrors = ParseErrorEnum`flow`(FlowErrorTemplates);
function isEsModuleType(bodyElement) {
  return bodyElement.type === "DeclareExportAllDeclaration" || bodyElement.type === "DeclareExportDeclaration" && (!bodyElement.declaration || bodyElement.declaration.type !== "TypeAlias" && bodyElement.declaration.type !== "InterfaceDeclaration");
}
function hasTypeImportKind(node) {
  return node.importKind === "type" || node.importKind === "typeof";
}
var exportSuggestions = {
  const: "declare export var",
  let: "declare export var",
  type: "export type",
  interface: "export interface"
};
function partition(list2, test) {
  const list1 = [];
  const list22 = [];
  for (let i = 0; i < list2.length; i++) {
    (test(list2[i], i, list2) ? list1 : list22).push(list2[i]);
  }
  return [list1, list22];
}
var FLOW_PRAGMA_REGEX = /\*?\s*@((?:no)?flow)\b/;
var flow = (superClass) => class FlowParserMixin extends superClass {
  flowPragma = void 0;
  getScopeHandler() {
    return FlowScopeHandler;
  }
  shouldParseTypes() {
    return this.getPluginOption("flow", "all") || this.flowPragma === "flow";
  }
  finishToken(type, val) {
    if (type !== 130 && type !== 9 && type !== 24) {
      if (this.flowPragma === void 0) {
        this.flowPragma = null;
      }
    }
    super.finishToken(type, val);
  }
  addComment(comment) {
    if (this.flowPragma === void 0) {
      const matches2 = FLOW_PRAGMA_REGEX.exec(comment.value);
      if (!matches2) ;
      else if (matches2[1] === "flow") {
        this.flowPragma = "flow";
      } else if (matches2[1] === "noflow") {
        this.flowPragma = "noflow";
      } else {
        throw new Error("Unexpected flow pragma");
      }
    }
    super.addComment(comment);
  }
  flowParseTypeInitialiser(tok) {
    const oldInType = this.state.inType;
    this.state.inType = true;
    this.expect(tok || 10);
    const type = this.flowParseType();
    this.state.inType = oldInType;
    return type;
  }
  flowParsePredicate() {
    const node = this.startNode();
    const moduloLoc = this.state.startLoc;
    this.next();
    this.expectContextual(106);
    if (this.state.lastTokStartLoc.index > moduloLoc.index + 1) {
      this.raise(FlowErrors.UnexpectedSpaceBetweenModuloChecks, moduloLoc);
    }
    if (this.eat(6)) {
      node.value = super.parseExpression();
      this.expect(7);
      return this.finishNode(node, "DeclaredPredicate");
    } else {
      return this.finishNode(node, "InferredPredicate");
    }
  }
  flowParseTypeAndPredicateInitialiser(allowLonePredicate) {
    const oldInType = this.state.inType;
    this.state.inType = true;
    this.expect(10);
    let type = null;
    let predicate = null;
    if (allowLonePredicate && this.match(50)) {
      this.state.inType = oldInType;
      predicate = this.flowParsePredicate();
    } else {
      type = this.flowParseType();
      this.state.inType = oldInType;
      if (this.match(50)) {
        predicate = this.flowParsePredicate();
      }
    }
    return [type, predicate];
  }
  flowParseDeclareClass(node) {
    this.next();
    this.flowParseInterfaceish(node, true);
    return this.finishNode(node, "DeclareClass");
  }
  flowParseDeclareFunction(node) {
    this.next();
    const id = node.id = this.parseIdentifier();
    const typeNode = this.startNode();
    const typeContainer = this.startNode();
    if (this.match(43)) {
      typeNode.typeParameters = this.flowParseTypeParameterDeclaration();
    } else {
      typeNode.typeParameters = null;
    }
    this.expect(6);
    const tmp = this.flowParseFunctionTypeParams();
    typeNode.params = tmp.params;
    typeNode.rest = tmp.rest;
    typeNode.this = tmp._this;
    this.expect(7);
    [typeNode.returnType, node.predicate] = this.flowParseTypeAndPredicateInitialiser(false);
    typeContainer.typeAnnotation = this.finishNode(typeNode, "FunctionTypeAnnotation");
    id.typeAnnotation = this.finishNode(typeContainer, "TypeAnnotation");
    this.resetEndLocation(id);
    this.semicolon();
    this.scope.declareName(node.id.name, 2048, node.id.start);
    return this.finishNode(node, "DeclareFunction");
  }
  flowParseDeclare(node, insideModule) {
    if (this.match(76)) {
      return this.flowParseDeclareClass(node);
    } else if (this.match(64)) {
      return this.flowParseDeclareFunction(node);
    } else if (this.match(70)) {
      return this.flowParseDeclareVariable(node);
    } else if (this.eatContextual(123)) {
      if (this.match(12)) {
        return this.flowParseDeclareModuleExports(node);
      } else {
        if (insideModule) {
          this.raise(FlowErrors.NestedDeclareModule, this.state.lastTokStartLoc);
        }
        return this.flowParseDeclareModule(node);
      }
    } else if (this.isContextual(126)) {
      return this.flowParseDeclareTypeAlias(node);
    } else if (this.isContextual(127)) {
      return this.flowParseDeclareOpaqueType(node);
    } else if (this.isContextual(125)) {
      return this.flowParseDeclareInterface(node);
    } else if (this.match(78)) {
      return this.flowParseDeclareExportDeclaration(node, insideModule);
    }
    throw this.unexpected();
  }
  flowParseDeclareVariable(node) {
    this.next();
    node.id = this.flowParseTypeAnnotatableIdentifier();
    this.scope.declareName(node.id.name, 5, node.id.start);
    this.semicolon();
    return this.finishNode(node, "DeclareVariable");
  }
  flowParseDeclareModule(node) {
    this.scope.enter(0);
    if (this.match(130)) {
      node.id = super.parseExprAtom();
    } else {
      node.id = this.parseIdentifier();
    }
    const bodyNode = this.startNode();
    const body = bodyNode.body = [];
    this.expect(2);
    while (!this.match(4)) {
      const bodyNode2 = this.startNode();
      if (this.match(79)) {
        this.next();
        if (!this.isContextual(126) && !this.match(83)) {
          this.raise(FlowErrors.InvalidNonTypeImportInDeclareModule, this.state.lastTokStartLoc);
        }
        body.push(super.parseImport(bodyNode2));
      } else {
        this.expectContextual(121, FlowErrors.UnsupportedStatementInDeclareModule);
        body.push(this.flowParseDeclare(bodyNode2, true));
      }
    }
    this.scope.exit();
    this.expect(4);
    node.body = this.finishNode(bodyNode, "BlockStatement");
    let kind = null;
    let hasModuleExport = false;
    body.forEach((bodyElement) => {
      if (isEsModuleType(bodyElement)) {
        if (kind === "CommonJS") {
          this.raise(FlowErrors.AmbiguousDeclareModuleKind, bodyElement);
        }
        kind = "ES";
      } else if (bodyElement.type === "DeclareModuleExports") {
        if (hasModuleExport) {
          this.raise(FlowErrors.DuplicateDeclareModuleExports, bodyElement);
        }
        if (kind === "ES") {
          this.raise(FlowErrors.AmbiguousDeclareModuleKind, bodyElement);
        }
        kind = "CommonJS";
        hasModuleExport = true;
      }
    });
    node.kind = kind || "CommonJS";
    return this.finishNode(node, "DeclareModule");
  }
  flowParseDeclareExportDeclaration(node, insideModule) {
    this.expect(78);
    if (this.eat(61)) {
      if (this.match(64) || this.match(76)) {
        node.declaration = this.flowParseDeclare(this.startNode());
      } else {
        node.declaration = this.flowParseType();
        this.semicolon();
      }
      node.default = true;
      return this.finishNode(node, "DeclareExportDeclaration");
    } else {
      if (this.match(71) || this.isLet() || (this.isContextual(126) || this.isContextual(125)) && !insideModule) {
        const label = this.state.value;
        throw this.raise(FlowErrors.UnsupportedDeclareExportKind, this.state.startLoc, {
          unsupportedExportKind: label,
          suggestion: exportSuggestions[label]
        });
      }
      if (this.match(70) || this.match(64) || this.match(76) || this.isContextual(127)) {
        node.declaration = this.flowParseDeclare(this.startNode());
        node.default = false;
        return this.finishNode(node, "DeclareExportDeclaration");
      } else if (this.match(51) || this.match(2) || this.isContextual(125) || this.isContextual(126) || this.isContextual(127)) {
        const result = this.parseExport(node, null);
        if (result.type === "ExportNamedDeclaration") {
          result.default = false;
          delete result.exportKind;
          return this.castNodeTo(result, "DeclareExportDeclaration");
        } else {
          return this.castNodeTo(result, "DeclareExportAllDeclaration");
        }
      }
    }
    throw this.unexpected();
  }
  flowParseDeclareModuleExports(node) {
    this.next();
    this.expectContextual(107);
    node.typeAnnotation = this.flowParseTypeAnnotation();
    this.semicolon();
    return this.finishNode(node, "DeclareModuleExports");
  }
  flowParseDeclareTypeAlias(node) {
    this.next();
    const finished = this.flowParseTypeAlias(node);
    this.castNodeTo(finished, "DeclareTypeAlias");
    return finished;
  }
  flowParseDeclareOpaqueType(node) {
    this.next();
    return this.flowParseOpaqueType(node, true);
  }
  flowParseDeclareInterface(node) {
    this.next();
    this.flowParseInterfaceish(node, false);
    return this.finishNode(node, "DeclareInterface");
  }
  flowParseInterfaceish(node, isClass) {
    node.id = this.flowParseRestrictedIdentifier(!isClass, true);
    this.scope.declareName(node.id.name, isClass ? 17 : 8201, node.id.start);
    if (this.match(43)) {
      node.typeParameters = this.flowParseTypeParameterDeclaration();
    } else {
      node.typeParameters = null;
    }
    node.extends = [];
    if (this.eat(77)) {
      do {
        node.extends.push(this.flowParseInterfaceExtends());
      } while (!isClass && this.eat(8));
    }
    if (isClass) {
      const implemented = [];
      const mixins = [];
      if (this.eatContextual(113)) {
        do {
          mixins.push(this.flowParseInterfaceExtends());
        } while (this.eat(8));
      }
      if (this.eatContextual(109)) {
        do {
          implemented.push(this.flowParseClassImplements());
        } while (this.eat(8));
      }
      node.implements = implemented;
      node.mixins = mixins;
    }
    node.body = this.flowParseObjectType({
      allowStatic: isClass,
      allowExact: false,
      allowSpread: false,
      allowProto: isClass,
      allowInexact: false
    });
  }
  flowParseInterfaceExtends() {
    const node = this.startNode();
    node.id = this.flowParseQualifiedTypeIdentifier();
    if (this.match(43)) {
      node.typeParameters = this.flowParseTypeParameterInstantiation();
    } else {
      node.typeParameters = null;
    }
    return this.finishNode(node, "InterfaceExtends");
  }
  flowParseInterface(node) {
    this.flowParseInterfaceish(node, false);
    return this.finishNode(node, "InterfaceDeclaration");
  }
  checkNotUnderscore(word) {
    if (word === "_") {
      this.raise(FlowErrors.UnexpectedReservedUnderscore, this.state.startLoc);
    }
  }
  checkReservedType(word, startLoc, declaration) {
    if (!reservedTypes.has(word)) return;
    this.raise(declaration ? FlowErrors.AssignReservedType : FlowErrors.UnexpectedReservedType, startLoc, {
      reservedType: word
    });
  }
  flowParseRestrictedIdentifierName(liberal, declaration) {
    this.checkReservedType(this.state.value, this.state.startLoc, declaration);
    return this.parseIdentifierName(liberal);
  }
  flowParseRestrictedIdentifier(liberal, declaration) {
    const node = this.startNode();
    const name = this.flowParseRestrictedIdentifierName(liberal, declaration);
    return this.createIdentifier(node, name);
  }
  flowParseTypeAlias(node) {
    node.id = this.flowParseRestrictedIdentifier(false, true);
    this.scope.declareName(node.id.name, 8201, node.id.start);
    if (this.match(43)) {
      node.typeParameters = this.flowParseTypeParameterDeclaration();
    } else {
      node.typeParameters = null;
    }
    node.right = this.flowParseTypeInitialiser(25);
    this.semicolon();
    return this.finishNode(node, "TypeAlias");
  }
  flowParseOpaqueType(node, declare) {
    this.expectContextual(126);
    node.id = this.flowParseRestrictedIdentifier(true, true);
    this.scope.declareName(node.id.name, 8201, node.id.start);
    if (this.match(43)) {
      node.typeParameters = this.flowParseTypeParameterDeclaration();
    } else {
      node.typeParameters = null;
    }
    node.supertype = null;
    if (this.match(10)) {
      node.supertype = this.flowParseTypeInitialiser(10);
    }
    node.impltype = null;
    if (!declare) {
      node.impltype = this.flowParseTypeInitialiser(25);
    }
    this.semicolon();
    return this.finishNode(node, declare ? "DeclareOpaqueType" : "OpaqueType");
  }
  flowParseTypeParameterBound() {
    if (this.match(10) || this.isContextual(77)) {
      const node = this.startNode();
      this.next();
      node.typeAnnotation = this.flowParseType();
      return this.finishNode(node, "TypeAnnotation");
    }
  }
  flowParseTypeParameter(requireDefault = false) {
    const nodeStartLoc = this.state.startLoc;
    const node = this.startNode();
    const variance = this.flowParseVariance();
    node.name = this.flowParseRestrictedIdentifierName();
    node.variance = variance;
    node.bound = this.flowParseTypeParameterBound();
    if (this.match(25)) {
      this.eat(25);
      node.default = this.flowParseType();
    } else {
      if (requireDefault) {
        this.raise(FlowErrors.MissingTypeParamDefault, nodeStartLoc);
      }
    }
    return this.finishNode(node, "TypeParameter");
  }
  flowParseTypeParameterDeclaration() {
    const oldInType = this.state.inType;
    const node = this.startNode();
    node.params = [];
    this.state.inType = true;
    if (this.match(43) || this.match(138)) {
      this.next();
    } else {
      this.unexpected();
    }
    let defaultRequired = false;
    do {
      const typeParameter = this.flowParseTypeParameter(defaultRequired);
      node.params.push(typeParameter);
      if (typeParameter.default) {
        defaultRequired = true;
      }
      if (!this.match(44)) {
        this.expect(8);
      }
    } while (!this.match(44));
    this.expect(44);
    this.state.inType = oldInType;
    return this.finishNode(node, "TypeParameterDeclaration");
  }
  flowInTopLevelContext(cb) {
    if (this.curContext() !== types.brace) {
      const oldContext = this.state.context;
      this.state.context = [oldContext[0]];
      try {
        return cb();
      } finally {
        this.state.context = oldContext;
      }
    } else {
      return cb();
    }
  }
  flowParseTypeParameterInstantiationInExpression() {
    if (this.reScan_lt() !== 43) return;
    return this.flowParseTypeParameterInstantiation();
  }
  flowParseTypeParameterInstantiation() {
    const node = this.startNode();
    const oldInType = this.state.inType;
    this.state.inType = true;
    node.params = [];
    this.flowInTopLevelContext(() => {
      this.expect(43);
      const oldNoAnonFunctionType = this.state.noAnonFunctionType;
      this.state.noAnonFunctionType = false;
      while (!this.match(44)) {
        node.params.push(this.flowParseType());
        if (!this.match(44)) {
          this.expect(8);
        }
      }
      this.state.noAnonFunctionType = oldNoAnonFunctionType;
    });
    this.state.inType = oldInType;
    if (!this.state.inType && this.curContext() === types.brace) {
      this.reScan_lt_gt();
    }
    this.expect(44);
    return this.finishNode(node, "TypeParameterInstantiation");
  }
  flowParseTypeParameterInstantiationCallOrNew() {
    if (this.reScan_lt() !== 43) return null;
    const node = this.startNode();
    const oldInType = this.state.inType;
    node.params = [];
    this.state.inType = true;
    this.expect(43);
    while (!this.match(44)) {
      node.params.push(this.flowParseTypeOrImplicitInstantiation());
      if (!this.match(44)) {
        this.expect(8);
      }
    }
    this.expect(44);
    this.state.inType = oldInType;
    return this.finishNode(node, "TypeParameterInstantiation");
  }
  flowParseInterfaceType() {
    const node = this.startNode();
    this.expectContextual(125);
    node.extends = [];
    if (this.eat(77)) {
      do {
        node.extends.push(this.flowParseInterfaceExtends());
      } while (this.eat(8));
    }
    node.body = this.flowParseObjectType({
      allowStatic: false,
      allowExact: false,
      allowSpread: false,
      allowProto: false,
      allowInexact: false
    });
    return this.finishNode(node, "InterfaceTypeAnnotation");
  }
  flowParseObjectPropertyKey() {
    return this.match(131) || this.match(130) ? super.parseExprAtom() : this.parseIdentifier(true);
  }
  flowParseObjectTypeIndexer(node, isStatic, variance) {
    node.static = isStatic;
    if (this.lookahead().type === 10) {
      node.id = this.parseIdentifier(true);
      node.key = this.flowParseTypeInitialiser();
    } else {
      node.id = null;
      node.key = this.flowParseType();
    }
    this.expect(1);
    node.value = this.flowParseTypeInitialiser();
    node.variance = variance;
    return this.finishNode(node, "ObjectTypeIndexer");
  }
  flowParseObjectTypeInternalSlot(node, isStatic) {
    node.static = isStatic;
    node.id = this.parseIdentifier(true);
    this.expect(1);
    this.expect(1);
    if (this.match(43) || this.match(6)) {
      node.method = true;
      node.optional = false;
      node.value = this.flowParseObjectTypeMethodish(this.startNodeAtNode(node));
    } else {
      node.method = false;
      if (this.eat(13)) {
        node.optional = true;
      }
      node.value = this.flowParseTypeInitialiser();
    }
    return this.finishNode(node, "ObjectTypeInternalSlot");
  }
  flowParseObjectTypeMethodish(node) {
    node.params = [];
    node.rest = null;
    node.typeParameters = null;
    node.this = null;
    if (this.match(43)) {
      node.typeParameters = this.flowParseTypeParameterDeclaration();
    }
    this.expect(6);
    if (this.match(74)) {
      node.this = this.flowParseFunctionTypeParam(true);
      node.this.name = null;
      if (!this.match(7)) {
        this.expect(8);
      }
    }
    while (!this.match(7) && !this.match(17)) {
      node.params.push(this.flowParseFunctionTypeParam(false));
      if (!this.match(7)) {
        this.expect(8);
      }
    }
    if (this.eat(17)) {
      node.rest = this.flowParseFunctionTypeParam(false);
    }
    this.expect(7);
    node.returnType = this.flowParseTypeInitialiser();
    return this.finishNode(node, "FunctionTypeAnnotation");
  }
  flowParseObjectTypeCallProperty(node, isStatic) {
    const valueNode = this.startNode();
    node.static = isStatic;
    node.value = this.flowParseObjectTypeMethodish(valueNode);
    return this.finishNode(node, "ObjectTypeCallProperty");
  }
  flowParseObjectType({
    allowStatic,
    allowExact,
    allowSpread,
    allowProto,
    allowInexact
  }) {
    const oldInType = this.state.inType;
    this.state.inType = true;
    const nodeStart = this.startNode();
    nodeStart.callProperties = [];
    nodeStart.properties = [];
    nodeStart.indexers = [];
    nodeStart.internalSlots = [];
    let endDelim;
    let exact;
    let inexact = false;
    if (allowExact && this.match(3)) {
      this.expect(3);
      endDelim = 5;
      exact = true;
    } else {
      this.expect(2);
      endDelim = 4;
      exact = false;
    }
    nodeStart.exact = exact;
    while (!this.match(endDelim)) {
      let isStatic = false;
      let protoStartLoc = null;
      let inexactStartLoc = null;
      const node = this.startNode();
      if (allowProto && this.isContextual(114)) {
        const lookahead = this.lookahead();
        if (lookahead.type !== 10 && lookahead.type !== 13) {
          this.next();
          protoStartLoc = this.state.startLoc;
          allowStatic = false;
        }
      }
      if (allowStatic && this.isContextual(102)) {
        const lookahead = this.lookahead();
        if (lookahead.type !== 10 && lookahead.type !== 13) {
          this.next();
          isStatic = true;
        }
      }
      const variance = this.flowParseVariance();
      if (this.eat(0)) {
        if (protoStartLoc != null) {
          this.unexpected(protoStartLoc);
        }
        if (this.eat(0)) {
          if (variance) {
            this.unexpected(variance.start);
          }
          nodeStart.internalSlots.push(this.flowParseObjectTypeInternalSlot(node, isStatic));
        } else {
          nodeStart.indexers.push(this.flowParseObjectTypeIndexer(node, isStatic, variance));
        }
      } else if (this.match(6) || this.match(43)) {
        if (protoStartLoc != null) {
          this.unexpected(protoStartLoc);
        }
        if (variance) {
          this.unexpected(variance.start);
        }
        nodeStart.callProperties.push(this.flowParseObjectTypeCallProperty(node, isStatic));
      } else {
        let kind = "init";
        if (this.isContextual(95) || this.isContextual(100)) {
          const lookahead = this.lookahead();
          if (tokenIsLiteralPropertyName(lookahead.type)) {
            kind = this.state.value;
            this.next();
          }
        }
        const propOrInexact = this.flowParseObjectTypeProperty(node, isStatic, protoStartLoc, variance, kind, allowSpread, allowInexact ?? !exact);
        if (propOrInexact === null) {
          inexact = true;
          inexactStartLoc = this.state.lastTokStartLoc;
        } else {
          nodeStart.properties.push(propOrInexact);
        }
      }
      this.flowObjectTypeSemicolon();
      if (inexactStartLoc && !this.match(4) && !this.match(5)) {
        this.raise(FlowErrors.UnexpectedExplicitInexactInObject, inexactStartLoc);
      }
    }
    this.expect(endDelim);
    if (allowSpread) {
      nodeStart.inexact = inexact;
    }
    const out = this.finishNode(nodeStart, "ObjectTypeAnnotation");
    this.state.inType = oldInType;
    return out;
  }
  flowParseObjectTypeProperty(node, isStatic, protoStartLoc, variance, kind, allowSpread, allowInexact) {
    if (this.eat(17)) {
      const isInexactToken = this.match(8) || this.match(9) || this.match(4) || this.match(5);
      if (isInexactToken) {
        if (!allowSpread) {
          this.raise(FlowErrors.InexactInsideNonObject, this.state.lastTokStartLoc);
        } else if (!allowInexact) {
          this.raise(FlowErrors.InexactInsideExact, this.state.lastTokStartLoc);
        }
        if (variance) {
          this.raise(FlowErrors.InexactVariance, variance);
        }
        return null;
      }
      if (!allowSpread) {
        this.raise(FlowErrors.UnexpectedSpreadType, this.state.lastTokStartLoc);
      }
      if (protoStartLoc != null) {
        this.unexpected(protoStartLoc);
      }
      if (variance) {
        this.raise(FlowErrors.SpreadVariance, variance);
      }
      node.argument = this.flowParseType();
      return this.finishNode(node, "ObjectTypeSpreadProperty");
    } else {
      node.key = this.flowParseObjectPropertyKey();
      node.static = isStatic;
      node.proto = protoStartLoc != null;
      node.kind = kind;
      let optional = false;
      if (this.match(43) || this.match(6)) {
        node.method = true;
        if (protoStartLoc != null) {
          this.unexpected(protoStartLoc);
        }
        if (variance) {
          this.unexpected(variance.start);
        }
        node.value = this.flowParseObjectTypeMethodish(this.startNodeAtNode(node));
        if (kind === "get" || kind === "set") {
          this.flowCheckGetterSetterParams(node);
        } else if (!isStatic && !allowSpread && node.key.name === "constructor" && node.value.this) {
          this.raise(FlowErrors.ThisParamBannedInConstructor, node.value.this);
        }
      } else {
        if (kind !== "init") this.unexpected();
        node.method = false;
        if (this.eat(13)) {
          optional = true;
        }
        node.value = this.flowParseTypeInitialiser();
        node.variance = variance;
      }
      node.optional = optional;
      return this.finishNode(node, "ObjectTypeProperty");
    }
  }
  flowCheckGetterSetterParams(property) {
    const paramCount = property.kind === "get" ? 0 : 1;
    const value = property.value;
    const length = value.params.length + (value.rest ? 1 : 0);
    if (value.this) {
      this.raise(property.kind === "get" ? FlowErrors.GetterMayNotHaveThisParam : FlowErrors.SetterMayNotHaveThisParam, value.this);
    }
    if (length !== paramCount) {
      this.raise(property.kind === "get" ? Errors.BadGetterArity : Errors.BadSetterArity, property);
    }
    if (property.kind === "set" && value.rest) {
      this.raise(Errors.BadSetterRestParameter, property);
    }
  }
  flowObjectTypeSemicolon() {
    if (!this.eat(9) && !this.eat(8) && !this.match(4) && !this.match(5)) {
      this.unexpected();
    }
  }
  flowParseQualifiedTypeIdentifier(startLoc, id) {
    startLoc ??= this.state.startLoc;
    let node = id || this.flowParseRestrictedIdentifier(true);
    while (this.eat(12)) {
      const node2 = this.startNodeAt(startLoc);
      node2.qualification = node;
      node2.id = this.flowParseRestrictedIdentifier(true);
      node = this.finishNode(node2, "QualifiedTypeIdentifier");
    }
    return node;
  }
  flowParseGenericType(startLoc, id) {
    const node = this.startNodeAt(startLoc);
    node.typeParameters = null;
    node.id = this.flowParseQualifiedTypeIdentifier(startLoc, id);
    if (this.match(43)) {
      node.typeParameters = this.flowParseTypeParameterInstantiation();
    }
    return this.finishNode(node, "GenericTypeAnnotation");
  }
  flowParseTypeofType() {
    const node = this.startNode();
    this.expect(83);
    node.argument = this.flowParsePrimaryType();
    return this.finishNode(node, "TypeofTypeAnnotation");
  }
  flowParseTupleType() {
    const node = this.startNode();
    node.types = [];
    this.expect(0);
    while (this.state.pos < this.length && !this.match(1)) {
      node.types.push(this.flowParseType());
      if (this.match(1)) break;
      this.expect(8);
    }
    this.expect(1);
    return this.finishNode(node, "TupleTypeAnnotation");
  }
  flowParseFunctionTypeParam(first) {
    let name = null;
    let optional = false;
    let typeAnnotation;
    const node = this.startNode();
    const lh = this.lookahead();
    const isThis = this.state.type === 74;
    if (lh.type === 10 || lh.type === 13) {
      if (isThis && !first) {
        this.raise(FlowErrors.ThisParamMustBeFirst, node);
      }
      name = this.parseIdentifier(isThis);
      if (this.eat(13)) {
        optional = true;
        if (isThis) {
          this.raise(FlowErrors.ThisParamMayNotBeOptional, node);
        }
      }
      typeAnnotation = this.flowParseTypeInitialiser();
    } else {
      typeAnnotation = this.flowParseType();
    }
    node.name = name;
    node.optional = optional;
    node.typeAnnotation = typeAnnotation;
    return this.finishNode(node, "FunctionTypeParam");
  }
  reinterpretTypeAsFunctionTypeParam(type) {
    const node = this.startNodeAtNode(type);
    node.name = null;
    node.optional = false;
    node.typeAnnotation = type;
    return this.finishNode(node, "FunctionTypeParam");
  }
  flowParseFunctionTypeParams(params = []) {
    let rest = null;
    let _this = null;
    if (this.match(74)) {
      _this = this.flowParseFunctionTypeParam(true);
      _this.name = null;
      if (!this.match(7)) {
        this.expect(8);
      }
    }
    while (!this.match(7) && !this.match(17)) {
      params.push(this.flowParseFunctionTypeParam(false));
      if (!this.match(7)) {
        this.expect(8);
      }
    }
    if (this.eat(17)) {
      rest = this.flowParseFunctionTypeParam(false);
    }
    return {
      params,
      rest,
      _this
    };
  }
  flowIdentToTypeAnnotation(startLoc, node, id) {
    switch (id.name) {
      case "any":
        return this.finishNode(node, "AnyTypeAnnotation");
      case "bool":
      case "boolean":
        return this.finishNode(node, "BooleanTypeAnnotation");
      case "mixed":
        return this.finishNode(node, "MixedTypeAnnotation");
      case "empty":
        return this.finishNode(node, "EmptyTypeAnnotation");
      case "number":
        return this.finishNode(node, "NumberTypeAnnotation");
      case "string":
        return this.finishNode(node, "StringTypeAnnotation");
      case "symbol":
        return this.finishNode(node, "SymbolTypeAnnotation");
      default:
        this.checkNotUnderscore(id.name);
        return this.flowParseGenericType(startLoc, id);
    }
  }
  flowParsePrimaryType() {
    const startLoc = this.state.startLoc;
    const node = this.startNode();
    let tmp;
    let type;
    let isGroupedType = false;
    const oldNoAnonFunctionType = this.state.noAnonFunctionType;
    switch (this.state.type) {
      case 2:
        return this.flowParseObjectType({
          allowStatic: false,
          allowExact: false,
          allowSpread: true,
          allowProto: false,
          allowInexact: true
        });
      case 3:
        return this.flowParseObjectType({
          allowStatic: false,
          allowExact: true,
          allowSpread: true,
          allowProto: false,
          allowInexact: false
        });
      case 0:
        this.state.noAnonFunctionType = false;
        type = this.flowParseTupleType();
        this.state.noAnonFunctionType = oldNoAnonFunctionType;
        return type;
      case 43: {
        const node2 = this.startNode();
        node2.typeParameters = this.flowParseTypeParameterDeclaration();
        this.expect(6);
        tmp = this.flowParseFunctionTypeParams();
        node2.params = tmp.params;
        node2.rest = tmp.rest;
        node2.this = tmp._this;
        this.expect(7);
        this.expect(15);
        node2.returnType = this.flowParseType();
        return this.finishNode(node2, "FunctionTypeAnnotation");
      }
      case 6: {
        const node2 = this.startNode();
        this.next();
        if (!this.match(7) && !this.match(17)) {
          if (tokenIsIdentifier(this.state.type) || this.match(74)) {
            const token = this.lookahead().type;
            isGroupedType = token !== 13 && token !== 10;
          } else {
            isGroupedType = true;
          }
        }
        if (isGroupedType) {
          this.state.noAnonFunctionType = false;
          type = this.flowParseType();
          this.state.noAnonFunctionType = oldNoAnonFunctionType;
          if (this.state.noAnonFunctionType || !(this.match(8) || this.match(7) && this.lookahead().type === 15)) {
            this.expect(7);
            return type;
          } else {
            this.eat(8);
          }
        }
        if (type) {
          tmp = this.flowParseFunctionTypeParams([this.reinterpretTypeAsFunctionTypeParam(type)]);
        } else {
          tmp = this.flowParseFunctionTypeParams();
        }
        node2.params = tmp.params;
        node2.rest = tmp.rest;
        node2.this = tmp._this;
        this.expect(7);
        this.expect(15);
        node2.returnType = this.flowParseType();
        node2.typeParameters = null;
        return this.finishNode(node2, "FunctionTypeAnnotation");
      }
      case 130:
        return this.parseLiteral(this.state.value, "StringLiteralTypeAnnotation");
      case 81:
      case 82:
        node.value = this.match(81);
        this.next();
        return this.finishNode(node, "BooleanLiteralTypeAnnotation");
      case 49:
        if (this.state.value === "-") {
          this.next();
          if (this.match(131)) {
            return this.parseLiteralAtNode(-this.state.value, "NumberLiteralTypeAnnotation", node);
          }
          if (this.match(132)) {
            return this.parseLiteralAtNode(-this.state.value, "BigIntLiteralTypeAnnotation", node);
          }
          throw this.raise(FlowErrors.UnexpectedSubtractionOperand, this.state.startLoc);
        }
        throw this.unexpected();
      case 131:
        return this.parseLiteral(this.state.value, "NumberLiteralTypeAnnotation");
      case 132:
        return this.parseLiteral(this.state.value, "BigIntLiteralTypeAnnotation");
      case 84:
        this.next();
        return this.finishNode(node, "VoidTypeAnnotation");
      case 80:
        this.next();
        return this.finishNode(node, "NullLiteralTypeAnnotation");
      case 74:
        this.next();
        return this.finishNode(node, "ThisTypeAnnotation");
      case 51:
        this.next();
        return this.finishNode(node, "ExistsTypeAnnotation");
      case 83:
        return this.flowParseTypeofType();
      default:
        if (tokenIsKeyword(this.state.type)) {
          const label = tokenLabelName(this.state.type);
          this.next();
          return super.createIdentifier(node, label);
        } else if (tokenIsIdentifier(this.state.type)) {
          if (this.isContextual(125)) {
            return this.flowParseInterfaceType();
          }
          return this.flowIdentToTypeAnnotation(startLoc, node, this.parseIdentifier());
        }
    }
    throw this.unexpected();
  }
  flowParsePostfixType() {
    const startLoc = this.state.startLoc;
    let type = this.flowParsePrimaryType();
    let seenOptionalIndexedAccess = false;
    while ((this.match(0) || this.match(14)) && !this.canInsertSemicolon()) {
      const node = this.startNodeAt(startLoc);
      const optional = this.eat(14);
      seenOptionalIndexedAccess = seenOptionalIndexedAccess || optional;
      this.expect(0);
      if (!optional && this.match(1)) {
        node.elementType = type;
        this.next();
        type = this.finishNode(node, "ArrayTypeAnnotation");
      } else {
        node.objectType = type;
        node.indexType = this.flowParseType();
        this.expect(1);
        if (seenOptionalIndexedAccess) {
          node.optional = optional;
          type = this.finishNode(node, "OptionalIndexedAccessType");
        } else {
          type = this.finishNode(node, "IndexedAccessType");
        }
      }
    }
    return type;
  }
  flowParsePrefixType() {
    const node = this.startNode();
    if (this.eat(13)) {
      node.typeAnnotation = this.flowParsePrefixType();
      return this.finishNode(node, "NullableTypeAnnotation");
    } else {
      return this.flowParsePostfixType();
    }
  }
  flowParseAnonFunctionWithoutParens() {
    const param = this.flowParsePrefixType();
    if (!this.state.noAnonFunctionType && this.eat(15)) {
      const node = this.startNodeAtNode(param);
      node.params = [this.reinterpretTypeAsFunctionTypeParam(param)];
      node.rest = null;
      node.this = null;
      node.returnType = this.flowParseType();
      node.typeParameters = null;
      return this.finishNode(node, "FunctionTypeAnnotation");
    }
    return param;
  }
  flowParseIntersectionType() {
    const node = this.startNode();
    this.eat(41);
    const type = this.flowParseAnonFunctionWithoutParens();
    node.types = [type];
    while (this.eat(41)) {
      node.types.push(this.flowParseAnonFunctionWithoutParens());
    }
    return node.types.length === 1 ? type : this.finishNode(node, "IntersectionTypeAnnotation");
  }
  flowParseUnionType() {
    const node = this.startNode();
    this.eat(39);
    const type = this.flowParseIntersectionType();
    node.types = [type];
    while (this.eat(39)) {
      node.types.push(this.flowParseIntersectionType());
    }
    return node.types.length === 1 ? type : this.finishNode(node, "UnionTypeAnnotation");
  }
  flowParseType() {
    const oldInType = this.state.inType;
    this.state.inType = true;
    const type = this.flowParseUnionType();
    this.state.inType = oldInType;
    return type;
  }
  flowParseTypeOrImplicitInstantiation() {
    if (this.state.type === 128 && this.state.value === "_") {
      const startLoc = this.state.startLoc;
      const node = this.parseIdentifier();
      return this.flowParseGenericType(startLoc, node);
    } else {
      return this.flowParseType();
    }
  }
  flowParseTypeAnnotation() {
    const node = this.startNode();
    node.typeAnnotation = this.flowParseTypeInitialiser();
    return this.finishNode(node, "TypeAnnotation");
  }
  flowParseTypeAnnotatableIdentifier() {
    const node = this.startNode();
    const name = this.parseIdentifierName();
    if (this.match(10)) {
      node.typeAnnotation = this.flowParseTypeAnnotation();
    }
    return this.createIdentifier(node, name);
  }
  typeCastToParameter(node) {
    node.expression.typeAnnotation = node.typeAnnotation;
    this.resetEndLocationFromNode(node.expression, node.typeAnnotation);
    return node.expression;
  }
  flowParseVariance() {
    let variance = null;
    if (this.match(49)) {
      variance = this.startNode();
      if (this.state.value === "+") {
        variance.kind = "plus";
      } else {
        variance.kind = "minus";
      }
      this.next();
      return this.finishNode(variance, "Variance");
    }
    return variance;
  }
  parseFunctionBody(node, allowExpressionBody, isMethod = false) {
    if (allowExpressionBody) {
      this.forwardNoArrowParamsConversionAt(node, () => super.parseFunctionBody(node, true, isMethod));
      return;
    }
    super.parseFunctionBody(node, false, isMethod);
  }
  parseFunctionBodyAndFinish(node, type, isMethod = false) {
    if (this.match(10)) {
      const typeNode = this.startNode();
      if (type === "FunctionDeclaration" || type === "FunctionExpression" || type === "ArrowFunctionExpression") {
        [typeNode.typeAnnotation, node.predicate] = this.flowParseTypeAndPredicateInitialiser(true);
      } else {
        typeNode.typeAnnotation = this.flowParseTypeInitialiser();
      }
      node.returnType = typeNode.typeAnnotation ? this.finishNode(typeNode, "TypeAnnotation") : null;
    }
    return super.parseFunctionBodyAndFinish(node, type, isMethod);
  }
  parseStatementLike(flags) {
    if (this.state.strict && this.isContextual(125)) {
      const lookahead = this.lookahead();
      if (tokenIsKeywordOrIdentifier(lookahead.type)) {
        const node = this.startNode();
        this.next();
        return this.flowParseInterface(node);
      }
    } else if (this.isContextual(122)) {
      const node = this.startNode();
      this.next();
      return this.flowParseEnumDeclaration(node);
    }
    const stmt = super.parseStatementLike(flags);
    if (this.flowPragma === void 0 && !this.isValidDirective(stmt)) {
      this.flowPragma = null;
    }
    return stmt;
  }
  parseExpressionStatement(node, expr, decorators) {
    if (expr.type === "Identifier") {
      if (expr.name === "declare") {
        if (this.match(76) || tokenIsIdentifier(this.state.type) || this.match(64) || this.match(70) || this.match(78)) {
          return this.flowParseDeclare(node);
        }
      } else if (tokenIsIdentifier(this.state.type)) {
        if (expr.name === "interface") {
          return this.flowParseInterface(node);
        } else if (expr.name === "type") {
          return this.flowParseTypeAlias(node);
        } else if (expr.name === "opaque") {
          return this.flowParseOpaqueType(node, false);
        }
      }
    }
    return super.parseExpressionStatement(node, expr, decorators);
  }
  shouldParseExportDeclaration() {
    const {
      type
    } = this.state;
    if (type === 122 || tokenIsFlowInterfaceOrTypeOrOpaque(type)) {
      return !this.state.containsEsc;
    }
    return super.shouldParseExportDeclaration();
  }
  isExportDefaultSpecifier() {
    const {
      type
    } = this.state;
    if (type === 122 || tokenIsFlowInterfaceOrTypeOrOpaque(type)) {
      return this.state.containsEsc;
    }
    return super.isExportDefaultSpecifier();
  }
  parseExportDefaultExpression() {
    if (this.isContextual(122)) {
      const node = this.startNode();
      this.next();
      return this.flowParseEnumDeclaration(node);
    }
    return super.parseExportDefaultExpression();
  }
  parseConditional(expr, startLoc, refExpressionErrors) {
    if (!this.match(13)) return expr;
    if (refExpressionErrors != null) {
      const nextCh = this.lookaheadCharCode();
      if (nextCh === 44 || nextCh === 61 || nextCh === 58 || nextCh === 41) {
        this.setOptionalParametersError(refExpressionErrors);
        return expr;
      }
    }
    this.expect(13);
    const state = this.state.clone();
    const originalNoArrowAt = this.state.noArrowAt;
    const node = this.startNodeAt(startLoc);
    let {
      consequent,
      failed
    } = this.tryParseConditionalConsequent();
    const result = this.getArrowLikeExpressions(consequent);
    let valid = result[0];
    const invalid = result[1];
    if (failed || invalid.length > 0) {
      const noArrowAt = [...originalNoArrowAt];
      if (invalid.length > 0) {
        this.state = state;
        this.state.noArrowAt = noArrowAt;
        for (let i = 0; i < invalid.length; i++) {
          noArrowAt.push(invalid[i].start);
        }
        ({
          consequent,
          failed
        } = this.tryParseConditionalConsequent());
        [valid] = this.getArrowLikeExpressions(consequent);
      }
      if (failed && valid.length > 1) {
        this.raise(FlowErrors.AmbiguousConditionalArrow, state.startLoc);
      }
      if (failed && valid.length === 1) {
        this.state = state;
        noArrowAt.push(valid[0].start);
        this.state.noArrowAt = noArrowAt;
        ({
          consequent
        } = this.tryParseConditionalConsequent());
      }
    }
    this.getArrowLikeExpressions(consequent, true);
    this.state.noArrowAt = originalNoArrowAt;
    this.expect(10);
    node.test = expr;
    node.consequent = consequent;
    node.alternate = this.forwardNoArrowParamsConversionAt(node, () => this.parseMaybeAssign(void 0, void 0));
    return this.finishNode(node, "ConditionalExpression");
  }
  tryParseConditionalConsequent() {
    this.state.noArrowParamsConversionAt.push(this.state.start);
    const consequent = this.parseMaybeAssignAllowIn();
    const failed = !this.match(10);
    this.state.noArrowParamsConversionAt.pop();
    return {
      consequent,
      failed
    };
  }
  getArrowLikeExpressions(node, disallowInvalid) {
    const stack = [node];
    const arrows = [];
    while (stack.length !== 0) {
      const node2 = stack.pop();
      if (node2.type === "ArrowFunctionExpression" && node2.body.type !== "BlockStatement") {
        if (node2.typeParameters || !node2.returnType) {
          this.finishArrowValidation(node2);
        } else {
          arrows.push(node2);
        }
        stack.push(node2.body);
      } else if (node2.type === "ConditionalExpression") {
        stack.push(node2.consequent);
        stack.push(node2.alternate);
      }
    }
    if (disallowInvalid) {
      arrows.forEach((node2) => this.finishArrowValidation(node2));
      return [arrows, []];
    }
    return partition(arrows, (node2) => node2.params.every((param) => this.isAssignable(param, true)));
  }
  finishArrowValidation(node) {
    this.toAssignableList(node.params, node.extra?.trailingCommaLoc, false);
    this.scope.enter(514 | 4);
    super.checkParams(node, false, true);
    this.scope.exit();
  }
  forwardNoArrowParamsConversionAt(node, parse2) {
    let result;
    if (this.state.noArrowParamsConversionAt.includes(this.offsetToSourcePos(node.start))) {
      this.state.noArrowParamsConversionAt.push(this.state.start);
      result = parse2();
      this.state.noArrowParamsConversionAt.pop();
    } else {
      result = parse2();
    }
    return result;
  }
  parseParenItem(node, startLoc) {
    const newNode = super.parseParenItem(node, startLoc);
    if (this.eat(13)) {
      newNode.optional = true;
      this.resetEndLocation(node);
    }
    if (this.match(10)) {
      const typeCastNode = this.startNodeAt(startLoc);
      typeCastNode.expression = newNode;
      typeCastNode.typeAnnotation = this.flowParseTypeAnnotation();
      return this.finishNode(typeCastNode, "TypeCastExpression");
    }
    return newNode;
  }
  assertModuleNodeAllowed(node) {
    if (node.type === "ImportDeclaration" && (node.importKind === "type" || node.importKind === "typeof") || node.type === "ExportNamedDeclaration" && node.exportKind === "type" || node.type === "ExportAllDeclaration" && node.exportKind === "type") {
      return;
    }
    super.assertModuleNodeAllowed(node);
  }
  parseExportDeclaration(node) {
    if (this.isContextual(126)) {
      node.exportKind = "type";
      const declarationNode = this.startNode();
      this.next();
      if (this.match(2)) {
        node.specifiers = this.parseExportSpecifiers(true);
        super.parseExportFrom(node);
        return null;
      } else {
        return this.flowParseTypeAlias(declarationNode);
      }
    } else if (this.isContextual(127)) {
      node.exportKind = "type";
      const declarationNode = this.startNode();
      this.next();
      return this.flowParseOpaqueType(declarationNode, false);
    } else if (this.isContextual(125)) {
      node.exportKind = "type";
      const declarationNode = this.startNode();
      this.next();
      return this.flowParseInterface(declarationNode);
    } else if (this.isContextual(122)) {
      node.exportKind = "value";
      const declarationNode = this.startNode();
      this.next();
      return this.flowParseEnumDeclaration(declarationNode);
    } else {
      return super.parseExportDeclaration(node);
    }
  }
  eatExportStar(node) {
    if (super.eatExportStar(node)) return true;
    if (this.isContextual(126) && this.lookahead().type === 51) {
      node.exportKind = "type";
      this.next();
      this.next();
      return true;
    }
    return false;
  }
  maybeParseExportNamespaceSpecifier(node) {
    const {
      startLoc
    } = this.state;
    const hasNamespace = super.maybeParseExportNamespaceSpecifier(node);
    if (hasNamespace && node.exportKind === "type") {
      this.unexpected(startLoc);
    }
    return hasNamespace;
  }
  parseClassId(node, isStatement, optionalId) {
    if ((!isStatement || optionalId) && this.isContextual(109)) {
      node.id = null;
      return;
    }
    super.parseClassId(node, isStatement, optionalId);
    if (this.match(43)) {
      node.typeParameters = this.flowParseTypeParameterDeclaration();
    }
  }
  parseClassMember(classBody, member, state) {
    const {
      startLoc
    } = this.state;
    if (this.isContextual(121)) {
      if (super.parseClassMemberFromModifier(classBody, member)) {
        return;
      }
      member.declare = true;
    }
    super.parseClassMember(classBody, member, state);
    if (member.declare) {
      if (member.type !== "ClassProperty" && member.type !== "ClassPrivateProperty" && member.type !== "PropertyDefinition") {
        this.raise(FlowErrors.DeclareClassElement, startLoc);
      } else if (member.value) {
        this.raise(FlowErrors.DeclareClassFieldInitializer, member.value);
      }
    }
  }
  isIterator(word) {
    return word === "iterator" || word === "asyncIterator";
  }
  readIterator() {
    const word = super.readWord1();
    const fullWord = "@@" + word;
    if (!this.isIterator(word) || !this.state.inType) {
      this.raise(Errors.InvalidIdentifier, this.state.curPosition(), {
        identifierName: fullWord
      });
    }
    this.finishToken(128, fullWord);
  }
  getTokenFromCode(code2) {
    const next = this.input.charCodeAt(this.state.pos + 1);
    if (code2 === 123 && next === 124) {
      this.finishOp(3, 2);
    } else if (this.state.inType && (code2 === 62 || code2 === 60)) {
      this.finishOp(code2 === 62 ? 44 : 43, 1);
    } else if (this.state.inType && code2 === 63) {
      if (next === 46) {
        this.finishOp(14, 2);
      } else {
        this.finishOp(13, 1);
      }
    } else if (isIteratorStart(code2, next, this.input.charCodeAt(this.state.pos + 2))) {
      this.state.pos += 2;
      this.readIterator();
    } else {
      super.getTokenFromCode(code2);
    }
  }
  isAssignable(node, isBinding) {
    if (node.type === "TypeCastExpression") {
      return this.isAssignable(node.expression, isBinding);
    } else {
      return super.isAssignable(node, isBinding);
    }
  }
  toAssignable(node, isLHS = false) {
    if (!isLHS && node.type === "AssignmentExpression" && node.left.type === "TypeCastExpression") {
      node.left = this.typeCastToParameter(node.left);
    }
    super.toAssignable(node, isLHS);
  }
  toAssignableListItem(exprList, index, isLHS) {
    const node = exprList[index];
    if (node.type === "TypeCastExpression") {
      exprList[index] = this.typeCastToParameter(node);
    }
    super.toAssignableListItem(exprList, index, isLHS);
  }
  toReferencedList(exprList, isParenthesizedExpr) {
    for (let i = 0; i < exprList.length; i++) {
      const expr = exprList[i];
      if (expr?.type === "TypeCastExpression" && !expr.extra?.parenthesized && (exprList.length > 1 || !isParenthesizedExpr)) {
        this.raise(FlowErrors.TypeCastInPattern, expr.typeAnnotation);
      }
    }
    return exprList;
  }
  parseArrayLike(close, refExpressionErrors) {
    const node = super.parseArrayLike(close, refExpressionErrors);
    if (node.type === "ArrayExpression") {
      this.toReferencedList(node.elements);
    }
    return node;
  }
  isValidLVal(type, disallowCallExpression, isParenthesized, binding) {
    return type === "TypeCastExpression" || super.isValidLVal(type, disallowCallExpression, isParenthesized, binding);
  }
  parseClassProperty(node) {
    if (this.match(10)) {
      node.typeAnnotation = this.flowParseTypeAnnotation();
    }
    return super.parseClassProperty(node);
  }
  parseClassPrivateProperty(node) {
    if (this.match(10)) {
      node.typeAnnotation = this.flowParseTypeAnnotation();
    }
    return super.parseClassPrivateProperty(node);
  }
  isClassMethod() {
    return this.match(43) || super.isClassMethod();
  }
  isClassProperty() {
    return this.match(10) || super.isClassProperty();
  }
  isNonstaticConstructor(method) {
    return !this.match(10) && super.isNonstaticConstructor(method);
  }
  pushClassMethod(classBody, method, isGenerator, isAsync, isConstructor, allowsDirectSuper) {
    if (method.variance) {
      this.unexpected(method.variance.start);
    }
    delete method.variance;
    if (this.match(43)) {
      method.typeParameters = this.flowParseTypeParameterDeclaration();
    }
    super.pushClassMethod(classBody, method, isGenerator, isAsync, isConstructor, allowsDirectSuper);
    if (method.params && isConstructor) {
      const params = method.params;
      if (params.length > 0 && this.isThisParam(params[0])) {
        this.raise(FlowErrors.ThisParamBannedInConstructor, method);
      }
    } else if (method.type === "MethodDefinition" && isConstructor && method.value.params) {
      const params = method.value.params;
      if (params.length > 0 && this.isThisParam(params[0])) {
        this.raise(FlowErrors.ThisParamBannedInConstructor, method);
      }
    }
  }
  pushClassPrivateMethod(classBody, method, isGenerator, isAsync) {
    if (method.variance) {
      this.unexpected(method.variance.start);
    }
    delete method.variance;
    if (this.match(43)) {
      method.typeParameters = this.flowParseTypeParameterDeclaration();
    }
    super.pushClassPrivateMethod(classBody, method, isGenerator, isAsync);
  }
  flowParseClassImplements() {
    const node = this.startNode();
    node.id = this.flowParseRestrictedIdentifier(true);
    if (this.match(43)) {
      node.typeParameters = this.flowParseTypeParameterInstantiation();
    } else {
      node.typeParameters = null;
    }
    return this.finishNode(node, "ClassImplements");
  }
  parseClassSuper(node) {
    super.parseClassSuper(node);
    if (node.superClass && (this.match(43) || this.match(47))) {
      node.superTypeArguments = this.flowParseTypeParameterInstantiationInExpression();
    }
    if (this.eatContextual(109)) {
      const implemented = node.implements = [];
      do {
        implemented.push(this.flowParseClassImplements());
      } while (this.eat(8));
    }
  }
  checkGetterSetterParams(method) {
    super.checkGetterSetterParams(method);
    const params = this.getObjectOrClassMethodParams(method);
    if (params.length > 0) {
      const param = params[0];
      if (this.isThisParam(param) && method.kind === "get") {
        this.raise(FlowErrors.GetterMayNotHaveThisParam, param);
      } else if (this.isThisParam(param)) {
        this.raise(FlowErrors.SetterMayNotHaveThisParam, param);
      }
    }
  }
  parsePropertyNamePrefixOperator(node) {
    node.variance = this.flowParseVariance();
  }
  parseObjPropValue(prop, startLoc, isGenerator, isAsync, isPattern, isAccessor, refExpressionErrors) {
    if (prop.variance) {
      this.unexpected(prop.variance.start);
    }
    delete prop.variance;
    let typeParameters;
    if (this.match(43) && !isAccessor) {
      typeParameters = this.flowParseTypeParameterDeclaration();
      if (!this.match(6)) this.unexpected();
    }
    const result = super.parseObjPropValue(prop, startLoc, isGenerator, isAsync, isPattern, isAccessor, refExpressionErrors);
    if (typeParameters) {
      (result.value || result).typeParameters = typeParameters;
    }
    return result;
  }
  parseFunctionParamType(param) {
    if (this.eat(13)) {
      if (param.type !== "Identifier") {
        this.raise(FlowErrors.PatternIsOptional, param);
      }
      if (this.isThisParam(param)) {
        this.raise(FlowErrors.ThisParamMayNotBeOptional, param);
      }
      param.optional = true;
    }
    if (this.match(10)) {
      param.typeAnnotation = this.flowParseTypeAnnotation();
    } else if (this.isThisParam(param)) {
      this.raise(FlowErrors.ThisParamAnnotationRequired, param);
    }
    if (this.match(25) && this.isThisParam(param)) {
      this.raise(FlowErrors.ThisParamNoDefault, param);
    }
    this.resetEndLocation(param);
    return param;
  }
  parseMaybeDefault(startLoc, left) {
    const node = super.parseMaybeDefault(startLoc, left);
    if (node.type === "AssignmentPattern" && node.typeAnnotation && node.right.start < node.typeAnnotation.start) {
      this.raise(FlowErrors.TypeBeforeInitializer, node.typeAnnotation);
    }
    return node;
  }
  parseImportSpecifierLocal(node, specifier, type) {
    specifier.local = hasTypeImportKind(node) ? this.flowParseRestrictedIdentifier(true, true) : this.parseIdentifier();
    node.specifiers.push(this.finishImportSpecifier(specifier, type));
  }
  isPotentialImportPhase(isExport) {
    if (super.isPotentialImportPhase(isExport)) return true;
    if (this.isContextual(126)) {
      if (!isExport) return true;
      const ch = this.lookaheadCharCode();
      return ch === 123 || ch === 42;
    }
    return !isExport && this.isContextual(83);
  }
  applyImportPhase(node, isExport, phase, loc) {
    super.applyImportPhase(node, isExport, phase, loc);
    if (isExport) {
      if (!phase && this.match(61)) {
        return;
      }
      node.exportKind = phase === "type" ? phase : "value";
    } else {
      if (phase === "type" && this.match(51)) this.unexpected();
      node.importKind = phase === "type" || phase === "typeof" ? phase : "value";
    }
  }
  parseImportSpecifier(specifier, importedIsString, isInTypeOnlyImport, isMaybeTypeOnly, bindingType) {
    const firstIdent = specifier.imported;
    let specifierTypeKind = null;
    if (firstIdent.type === "Identifier") {
      if (firstIdent.name === "type") {
        specifierTypeKind = "type";
      } else if (firstIdent.name === "typeof") {
        specifierTypeKind = "typeof";
      }
    }
    let isBinding = false;
    if (this.isContextual(89) && !this.isLookaheadContextual("as")) {
      const as_ident = this.parseIdentifier(true);
      if (specifierTypeKind !== null && !tokenIsKeywordOrIdentifier(this.state.type)) {
        specifier.imported = as_ident;
        specifier.importKind = specifierTypeKind;
        specifier.local = this.cloneIdentifier(as_ident);
      } else {
        specifier.imported = firstIdent;
        specifier.importKind = null;
        specifier.local = this.parseIdentifier();
      }
    } else {
      if (specifierTypeKind !== null && tokenIsKeywordOrIdentifier(this.state.type)) {
        specifier.imported = this.parseIdentifier(true);
        specifier.importKind = specifierTypeKind;
      } else {
        if (importedIsString) {
          throw this.raise(Errors.ImportBindingIsString, specifier, {
            importName: firstIdent.value
          });
        }
        specifier.imported = firstIdent;
        specifier.importKind = null;
      }
      if (this.eatContextual(89)) {
        specifier.local = this.parseIdentifier();
      } else {
        isBinding = true;
        specifier.local = this.cloneIdentifier(specifier.imported);
      }
    }
    const specifierIsTypeImport = hasTypeImportKind(specifier);
    if (isInTypeOnlyImport && specifierIsTypeImport) {
      this.raise(FlowErrors.ImportTypeShorthandOnlyInPureImport, specifier);
    }
    if (isInTypeOnlyImport || specifierIsTypeImport) {
      this.checkReservedType(specifier.local.name, specifier.local.start, true);
    }
    if (isBinding && !isInTypeOnlyImport && !specifierIsTypeImport) {
      this.checkReservedWord(specifier.local.name, specifier.start, true, true);
    }
    return this.finishImportSpecifier(specifier, "ImportSpecifier");
  }
  parseBindingAtom() {
    switch (this.state.type) {
      case 74:
        return this.parseIdentifier(true);
      default:
        return super.parseBindingAtom();
    }
  }
  parseFunctionParams(node, isConstructor) {
    const kind = node.kind;
    if (kind !== "get" && kind !== "set" && this.match(43)) {
      node.typeParameters = this.flowParseTypeParameterDeclaration();
    }
    super.parseFunctionParams(node, isConstructor);
  }
  parseVarId(decl, kind) {
    super.parseVarId(decl, kind);
    if (this.match(10)) {
      decl.id.typeAnnotation = this.flowParseTypeAnnotation();
      this.resetEndLocation(decl.id);
    }
  }
  parseAsyncArrowFromCallExpression(node, call) {
    if (this.match(10)) {
      const oldNoAnonFunctionType = this.state.noAnonFunctionType;
      this.state.noAnonFunctionType = true;
      node.returnType = this.flowParseTypeAnnotation();
      this.state.noAnonFunctionType = oldNoAnonFunctionType;
    }
    return super.parseAsyncArrowFromCallExpression(node, call);
  }
  shouldParseAsyncArrow() {
    return this.match(10) || super.shouldParseAsyncArrow();
  }
  parseMaybeAssign(refExpressionErrors, afterLeftParse) {
    let state = null;
    let jsx2;
    if (this.hasPlugin("jsx") && (this.match(138) || this.match(43))) {
      state = this.state.clone();
      jsx2 = this.tryParse(() => super.parseMaybeAssign(refExpressionErrors, afterLeftParse), state);
      if (!jsx2.error) return jsx2.node;
      const {
        context
      } = this.state;
      const currentContext = context[context.length - 1];
      if (currentContext === types.j_oTag || currentContext === types.j_expr) {
        context.pop();
      }
    }
    if (jsx2?.error || this.match(43)) {
      state = state || this.state.clone();
      let typeParameters;
      const arrow = this.tryParse((abort) => {
        typeParameters = this.flowParseTypeParameterDeclaration();
        const arrowExpression2 = this.forwardNoArrowParamsConversionAt(typeParameters, () => {
          const result = super.parseMaybeAssign(refExpressionErrors, afterLeftParse);
          this.resetStartLocationFromNode(result, typeParameters);
          return result;
        });
        if (arrowExpression2.extra?.parenthesized) abort();
        const expr = this.maybeUnwrapTypeCastExpression(arrowExpression2);
        if (expr.type !== "ArrowFunctionExpression") abort();
        expr.typeParameters = typeParameters;
        this.resetStartLocationFromNode(expr, typeParameters);
        return arrowExpression2;
      }, state);
      let arrowExpression = null;
      if (arrow.node && this.maybeUnwrapTypeCastExpression(arrow.node).type === "ArrowFunctionExpression") {
        if (!arrow.error && !arrow.aborted) {
          if (arrow.node.async) {
            this.raise(FlowErrors.UnexpectedTypeParameterBeforeAsyncArrowFunction, typeParameters);
          }
          return arrow.node;
        }
        arrowExpression = arrow.node;
      }
      if (jsx2?.node) {
        this.state = jsx2.failState;
        return jsx2.node;
      }
      if (arrowExpression) {
        this.state = arrow.failState;
        return arrowExpression;
      }
      if (jsx2?.thrown) throw jsx2.error;
      if (arrow.thrown) throw arrow.error;
      throw this.raise(FlowErrors.UnexpectedTokenAfterTypeParameter, typeParameters);
    }
    return super.parseMaybeAssign(refExpressionErrors, afterLeftParse);
  }
  parseArrow(node) {
    if (this.match(10)) {
      const result = this.tryParse(() => {
        const oldNoAnonFunctionType = this.state.noAnonFunctionType;
        this.state.noAnonFunctionType = true;
        const typeNode = this.startNode();
        [typeNode.typeAnnotation, node.predicate] = this.flowParseTypeAndPredicateInitialiser(true);
        this.state.noAnonFunctionType = oldNoAnonFunctionType;
        if (this.canInsertSemicolon()) this.unexpected();
        if (!this.match(15)) this.unexpected();
        return typeNode;
      });
      if (result.thrown) return null;
      if (result.error) this.state = result.failState;
      node.returnType = result.node.typeAnnotation ? this.finishNode(result.node, "TypeAnnotation") : null;
    }
    return super.parseArrow(node);
  }
  shouldParseArrow(params) {
    return this.match(10) || super.shouldParseArrow(params);
  }
  setArrowFunctionParameters(node, params) {
    if (this.state.noArrowParamsConversionAt.includes(this.offsetToSourcePos(node.start))) {
      node.params = params;
    } else {
      super.setArrowFunctionParameters(node, params);
    }
  }
  checkParams(node, allowDuplicates, isArrowFunction, strictModeChanged = true) {
    if (isArrowFunction && this.state.noArrowParamsConversionAt.includes(this.offsetToSourcePos(node.start))) {
      return;
    }
    for (let i = 0; i < node.params.length; i++) {
      if (this.isThisParam(node.params[i]) && i > 0) {
        this.raise(FlowErrors.ThisParamMustBeFirst, node.params[i]);
      }
    }
    super.checkParams(node, allowDuplicates, isArrowFunction, strictModeChanged);
  }
  parseParenAndDistinguishExpression(canStartArrow) {
    return super.parseParenAndDistinguishExpression(canStartArrow && !this.state.noArrowAt.includes(this.sourceToOffsetPos(this.state.start)));
  }
  parseSubscripts(base, startLoc, noCalls) {
    if (base.type === "Identifier" && base.name === "async" && this.state.noArrowAt.includes(startLoc.index)) {
      this.next();
      const node = this.startNodeAt(startLoc);
      node.callee = base;
      node.arguments = super.parseCallExpressionArguments();
      base = this.finishNode(node, "CallExpression");
    } else if (base.type === "Identifier" && base.name === "async" && this.match(43)) {
      const state = this.state.clone();
      const arrow = this.tryParse((abort) => this.parseAsyncArrowWithTypeParameters(startLoc) || abort(), state);
      if (!arrow.error && !arrow.aborted) return arrow.node;
      const result = this.tryParse(() => super.parseSubscripts(base, startLoc, noCalls), state);
      if (result.node && !result.error) return result.node;
      if (arrow.node) {
        this.state = arrow.failState;
        return arrow.node;
      }
      if (result.node) {
        this.state = result.failState;
        return result.node;
      }
      throw arrow.error || result.error;
    }
    return super.parseSubscripts(base, startLoc, noCalls);
  }
  parseSubscript(base, startLoc, noCalls, subscriptState) {
    if (this.match(14) && this.isLookaheadToken_lt()) {
      subscriptState.optionalChainMember = true;
      if (noCalls) {
        subscriptState.stop = true;
        return base;
      }
      this.next();
      const node = this.startNodeAt(startLoc);
      node.callee = base;
      node.typeArguments = this.flowParseTypeParameterInstantiationInExpression();
      this.expect(6);
      node.arguments = this.parseCallExpressionArguments();
      node.optional = true;
      return this.finishCallExpression(node, true);
    } else if (!noCalls && this.shouldParseTypes() && (this.match(43) || this.match(47))) {
      const node = this.startNodeAt(startLoc);
      node.callee = base;
      const result = this.tryParse(() => {
        node.typeArguments = this.flowParseTypeParameterInstantiationCallOrNew();
        this.expect(6);
        node.arguments = super.parseCallExpressionArguments();
        if (subscriptState.optionalChainMember) {
          node.optional = false;
        }
        return this.finishCallExpression(node, subscriptState.optionalChainMember);
      });
      if (result.node) {
        if (result.error) this.state = result.failState;
        return result.node;
      }
    }
    return super.parseSubscript(base, startLoc, noCalls, subscriptState);
  }
  parseNewCallee(node) {
    super.parseNewCallee(node);
    let targs = null;
    if (this.shouldParseTypes() && this.match(43)) {
      targs = this.tryParse(() => this.flowParseTypeParameterInstantiationCallOrNew()).node;
    }
    node.typeArguments = targs;
  }
  parseAsyncArrowWithTypeParameters(startLoc) {
    const node = this.startNodeAt(startLoc);
    this.parseFunctionParams(node, false);
    if (!this.parseArrow(node)) return;
    return super.parseArrowExpression(node, void 0, true);
  }
  readToken_mult_modulo(code2) {
    const next = this.input.charCodeAt(this.state.pos + 1);
    if (code2 === 42 && next === 47 && this.state.hasFlowComment) {
      this.state.hasFlowComment = false;
      this.state.pos += 2;
      this.nextToken();
      return;
    }
    super.readToken_mult_modulo(code2);
  }
  readToken_pipe_amp(code2) {
    const next = this.input.charCodeAt(this.state.pos + 1);
    if (code2 === 124 && next === 125) {
      this.finishOp(5, 2);
      return;
    }
    super.readToken_pipe_amp(code2);
  }
  parseTopLevel(file, program) {
    const fileNode = super.parseTopLevel(file, program);
    if (this.state.hasFlowComment) {
      this.raise(FlowErrors.UnterminatedFlowComment, this.state.curPosition());
    }
    return fileNode;
  }
  skipBlockComment() {
    if (this.hasPlugin("flowComments") && this.skipFlowComment()) {
      if (this.state.hasFlowComment) {
        throw this.raise(FlowErrors.NestedFlowComment, this.state.startLoc);
      }
      this.hasFlowCommentCompletion();
      const commentSkip = this.skipFlowComment();
      if (commentSkip) {
        this.state.pos += commentSkip;
        this.state.hasFlowComment = true;
      }
      return;
    }
    return super.skipBlockComment(this.state.hasFlowComment ? "*-/" : "*/");
  }
  skipFlowComment() {
    const {
      pos
    } = this.state;
    let shiftToFirstNonWhiteSpace = 2;
    while ([32, 9].includes(this.input.charCodeAt(pos + shiftToFirstNonWhiteSpace))) {
      shiftToFirstNonWhiteSpace++;
    }
    const ch2 = this.input.charCodeAt(shiftToFirstNonWhiteSpace + pos);
    const ch3 = this.input.charCodeAt(shiftToFirstNonWhiteSpace + pos + 1);
    if (ch2 === 58 && ch3 === 58) {
      return shiftToFirstNonWhiteSpace + 2;
    }
    if (this.input.slice(shiftToFirstNonWhiteSpace + pos, shiftToFirstNonWhiteSpace + pos + 12) === "flow-include") {
      return shiftToFirstNonWhiteSpace + 12;
    }
    if (ch2 === 58 && ch3 !== 58) {
      return shiftToFirstNonWhiteSpace;
    }
    return false;
  }
  hasFlowCommentCompletion() {
    const end = this.input.indexOf("*/", this.state.pos);
    if (end === -1) {
      throw this.raise(Errors.UnterminatedComment, this.state.curPosition());
    }
  }
  flowEnumErrorBooleanMemberNotInitialized(loc, names) {
    this.raise(FlowErrors.EnumBooleanMemberNotInitialized, loc, names);
  }
  flowEnumErrorInvalidMemberInitializer(loc, enumContext) {
    return this.raise(!enumContext.explicitType ? FlowErrors.EnumInvalidMemberInitializerUnknownType : enumContext.explicitType === "symbol" ? FlowErrors.EnumInvalidMemberInitializerSymbolType : FlowErrors.EnumInvalidMemberInitializerPrimaryType, loc, enumContext);
  }
  flowEnumErrorNumberMemberNotInitialized(loc, details) {
    this.raise(FlowErrors.EnumNumberMemberNotInitialized, loc, details);
  }
  flowEnumErrorStringMemberInconsistentlyInitialized(node, details) {
    this.raise(FlowErrors.EnumStringMemberInconsistentlyInitialized, node, details);
  }
  flowEnumMemberInit() {
    const startLoc = this.state.startLoc;
    const endOfInit = () => this.match(8) || this.match(4);
    switch (this.state.type) {
      case 131: {
        const literal = this.parseNumericLiteral(this.state.value);
        if (endOfInit()) {
          return {
            type: "number",
            loc: literal.start,
            value: literal
          };
        }
        break;
      }
      case 130: {
        const literal = this.parseStringLiteral(this.state.value);
        if (endOfInit()) {
          return {
            type: "string",
            loc: literal.start,
            value: literal
          };
        }
        break;
      }
      case 81:
      case 82: {
        const literal = this.parseBooleanLiteral(this.match(81));
        if (endOfInit()) {
          return {
            type: "boolean",
            loc: literal.start,
            value: literal
          };
        }
      }
    }
    return {
      type: "invalid",
      loc: startLoc
    };
  }
  flowEnumMemberRaw() {
    const loc = this.state.startLoc;
    const id = this.parseIdentifier(true);
    const init = this.eat(25) ? this.flowEnumMemberInit() : {
      type: "none",
      loc
    };
    return {
      id,
      init
    };
  }
  flowEnumCheckExplicitTypeMismatch(loc, context, expectedType) {
    const {
      explicitType
    } = context;
    if (explicitType === null) {
      return;
    }
    if (explicitType !== expectedType) {
      this.flowEnumErrorInvalidMemberInitializer(loc, context);
    }
  }
  flowEnumMembers({
    enumName,
    explicitType
  }) {
    const seenNames = /* @__PURE__ */ new Set();
    const members = {
      booleanMembers: [],
      numberMembers: [],
      stringMembers: [],
      defaultedMembers: []
    };
    let hasUnknownMembers = false;
    while (!this.match(4)) {
      if (this.eat(17)) {
        hasUnknownMembers = true;
        break;
      }
      const memberNode = this.startNode();
      const {
        id,
        init
      } = this.flowEnumMemberRaw();
      const memberName = id.name;
      if (memberName === "") {
        continue;
      }
      if (/^[a-z]/.test(memberName)) {
        this.raise(FlowErrors.EnumInvalidMemberName, id, {
          memberName,
          suggestion: memberName[0].toUpperCase() + memberName.slice(1),
          enumName
        });
      }
      if (seenNames.has(memberName)) {
        this.raise(FlowErrors.EnumDuplicateMemberName, id, {
          memberName,
          enumName
        });
      }
      seenNames.add(memberName);
      const context = {
        enumName,
        explicitType,
        memberName
      };
      memberNode.id = id;
      switch (init.type) {
        case "boolean": {
          this.flowEnumCheckExplicitTypeMismatch(init.loc, context, "boolean");
          memberNode.init = init.value;
          members.booleanMembers.push(this.finishNode(memberNode, "EnumBooleanMember"));
          break;
        }
        case "number": {
          this.flowEnumCheckExplicitTypeMismatch(init.loc, context, "number");
          memberNode.init = init.value;
          members.numberMembers.push(this.finishNode(memberNode, "EnumNumberMember"));
          break;
        }
        case "string": {
          this.flowEnumCheckExplicitTypeMismatch(init.loc, context, "string");
          memberNode.init = init.value;
          members.stringMembers.push(this.finishNode(memberNode, "EnumStringMember"));
          break;
        }
        case "invalid": {
          throw this.flowEnumErrorInvalidMemberInitializer(init.loc, context);
        }
        case "none": {
          switch (explicitType) {
            case "boolean":
              this.flowEnumErrorBooleanMemberNotInitialized(init.loc, context);
              break;
            case "number":
              this.flowEnumErrorNumberMemberNotInitialized(init.loc, context);
              break;
            default:
              members.defaultedMembers.push(this.finishNode(memberNode, "EnumDefaultedMember"));
          }
        }
      }
      if (!this.match(4)) {
        this.expect(8);
      }
    }
    return {
      members,
      hasUnknownMembers
    };
  }
  flowEnumStringMembers(initializedMembers, defaultedMembers, {
    enumName
  }) {
    if (initializedMembers.length === 0) {
      return defaultedMembers;
    } else if (defaultedMembers.length === 0) {
      return initializedMembers;
    } else if (defaultedMembers.length > initializedMembers.length) {
      for (const member of initializedMembers) {
        this.flowEnumErrorStringMemberInconsistentlyInitialized(member, {
          enumName
        });
      }
      return defaultedMembers;
    } else {
      for (const member of defaultedMembers) {
        this.flowEnumErrorStringMemberInconsistentlyInitialized(member, {
          enumName
        });
      }
      return initializedMembers;
    }
  }
  flowEnumParseExplicitType({
    enumName
  }) {
    if (!this.eatContextual(98)) return null;
    if (!tokenIsIdentifier(this.state.type)) {
      throw this.raise(FlowErrors.EnumInvalidExplicitTypeUnknownSupplied, this.state.startLoc, {
        enumName
      });
    }
    const {
      value
    } = this.state;
    this.next();
    if (value !== "boolean" && value !== "number" && value !== "string" && value !== "symbol") {
      this.raise(FlowErrors.EnumInvalidExplicitType, this.state.startLoc, {
        enumName,
        invalidEnumType: value
      });
    }
    return value;
  }
  flowEnumBody(node, id) {
    const enumName = id.name;
    const nameLoc = id.start;
    const explicitType = this.flowEnumParseExplicitType({
      enumName
    });
    this.expect(2);
    const {
      members,
      hasUnknownMembers
    } = this.flowEnumMembers({
      enumName,
      explicitType
    });
    node.hasUnknownMembers = hasUnknownMembers;
    switch (explicitType) {
      case "boolean":
        node.explicitType = true;
        node.members = members.booleanMembers;
        this.expect(4);
        return this.finishNode(node, "EnumBooleanBody");
      case "number":
        node.explicitType = true;
        node.members = members.numberMembers;
        this.expect(4);
        return this.finishNode(node, "EnumNumberBody");
      case "string":
        node.explicitType = true;
        node.members = this.flowEnumStringMembers(members.stringMembers, members.defaultedMembers, {
          enumName
        });
        this.expect(4);
        return this.finishNode(node, "EnumStringBody");
      case "symbol":
        node.members = members.defaultedMembers;
        this.expect(4);
        return this.finishNode(node, "EnumSymbolBody");
      default: {
        const empty = () => {
          node.members = [];
          this.expect(4);
          return this.finishNode(node, "EnumStringBody");
        };
        node.explicitType = false;
        const boolsLen = members.booleanMembers.length;
        const numsLen = members.numberMembers.length;
        const strsLen = members.stringMembers.length;
        const defaultedLen = members.defaultedMembers.length;
        if (!boolsLen && !numsLen && !strsLen && !defaultedLen) {
          return empty();
        } else if (!boolsLen && !numsLen) {
          node.members = this.flowEnumStringMembers(members.stringMembers, members.defaultedMembers, {
            enumName
          });
          this.expect(4);
          return this.finishNode(node, "EnumStringBody");
        } else if (!numsLen && !strsLen && boolsLen >= defaultedLen) {
          for (const member of members.defaultedMembers) {
            this.flowEnumErrorBooleanMemberNotInitialized(member.start, {
              enumName,
              memberName: member.id.name
            });
          }
          node.members = members.booleanMembers;
          this.expect(4);
          return this.finishNode(node, "EnumBooleanBody");
        } else if (!boolsLen && !strsLen && numsLen >= defaultedLen) {
          for (const member of members.defaultedMembers) {
            this.flowEnumErrorNumberMemberNotInitialized(member.start, {
              enumName,
              memberName: member.id.name
            });
          }
          node.members = members.numberMembers;
          this.expect(4);
          return this.finishNode(node, "EnumNumberBody");
        } else {
          this.raise(FlowErrors.EnumInconsistentMemberValues, nameLoc, {
            enumName
          });
          return empty();
        }
      }
    }
  }
  flowParseEnumDeclaration(node) {
    const id = this.parseIdentifier();
    node.id = id;
    node.body = this.flowEnumBody(this.startNode(), id);
    return this.finishNode(node, "EnumDeclaration");
  }
  jsxParseOpeningElementAfterName(node) {
    if (this.shouldParseTypes()) {
      if (this.match(43) || this.match(47)) {
        node.typeArguments = this.flowParseTypeParameterInstantiationInExpression();
      }
    }
    return super.jsxParseOpeningElementAfterName(node);
  }
  isLookaheadToken_lt() {
    const next = this.nextTokenStart();
    if (this.input.charCodeAt(next) === 60) {
      const afterNext = this.input.charCodeAt(next + 1);
      return afterNext !== 60 && afterNext !== 61;
    }
    return false;
  }
  reScan_lt_gt() {
    const {
      type
    } = this.state;
    if (type === 43) {
      this.state.pos -= 1;
      this.readToken_lt();
    } else if (type === 44) {
      this.state.pos -= 1;
      this.readToken_gt();
    }
  }
  reScan_lt() {
    const {
      type
    } = this.state;
    if (type === 47) {
      this.state.pos -= 2;
      this.finishOp(43, 1);
      return 43;
    }
    return type;
  }
  maybeUnwrapTypeCastExpression(node) {
    return node.type === "TypeCastExpression" ? node.expression : node;
  }
};
var entities = {
  __proto__: null,
  quot: '"',
  amp: "&",
  apos: "'",
  lt: "<",
  gt: ">",
  nbsp: "\xA0",
  iexcl: "\xA1",
  cent: "\xA2",
  pound: "\xA3",
  curren: "\xA4",
  yen: "\xA5",
  brvbar: "\xA6",
  sect: "\xA7",
  uml: "\xA8",
  copy: "\xA9",
  ordf: "\xAA",
  laquo: "\xAB",
  not: "\xAC",
  shy: "\xAD",
  reg: "\xAE",
  macr: "\xAF",
  deg: "\xB0",
  plusmn: "\xB1",
  sup2: "\xB2",
  sup3: "\xB3",
  acute: "\xB4",
  micro: "\xB5",
  para: "\xB6",
  middot: "\xB7",
  cedil: "\xB8",
  sup1: "\xB9",
  ordm: "\xBA",
  raquo: "\xBB",
  frac14: "\xBC",
  frac12: "\xBD",
  frac34: "\xBE",
  iquest: "\xBF",
  Agrave: "\xC0",
  Aacute: "\xC1",
  Acirc: "\xC2",
  Atilde: "\xC3",
  Auml: "\xC4",
  Aring: "\xC5",
  AElig: "\xC6",
  Ccedil: "\xC7",
  Egrave: "\xC8",
  Eacute: "\xC9",
  Ecirc: "\xCA",
  Euml: "\xCB",
  Igrave: "\xCC",
  Iacute: "\xCD",
  Icirc: "\xCE",
  Iuml: "\xCF",
  ETH: "\xD0",
  Ntilde: "\xD1",
  Ograve: "\xD2",
  Oacute: "\xD3",
  Ocirc: "\xD4",
  Otilde: "\xD5",
  Ouml: "\xD6",
  times: "\xD7",
  Oslash: "\xD8",
  Ugrave: "\xD9",
  Uacute: "\xDA",
  Ucirc: "\xDB",
  Uuml: "\xDC",
  Yacute: "\xDD",
  THORN: "\xDE",
  szlig: "\xDF",
  agrave: "\xE0",
  aacute: "\xE1",
  acirc: "\xE2",
  atilde: "\xE3",
  auml: "\xE4",
  aring: "\xE5",
  aelig: "\xE6",
  ccedil: "\xE7",
  egrave: "\xE8",
  eacute: "\xE9",
  ecirc: "\xEA",
  euml: "\xEB",
  igrave: "\xEC",
  iacute: "\xED",
  icirc: "\xEE",
  iuml: "\xEF",
  eth: "\xF0",
  ntilde: "\xF1",
  ograve: "\xF2",
  oacute: "\xF3",
  ocirc: "\xF4",
  otilde: "\xF5",
  ouml: "\xF6",
  divide: "\xF7",
  oslash: "\xF8",
  ugrave: "\xF9",
  uacute: "\xFA",
  ucirc: "\xFB",
  uuml: "\xFC",
  yacute: "\xFD",
  thorn: "\xFE",
  yuml: "\xFF",
  OElig: "\u0152",
  oelig: "\u0153",
  Scaron: "\u0160",
  scaron: "\u0161",
  Yuml: "\u0178",
  fnof: "\u0192",
  circ: "\u02C6",
  tilde: "\u02DC",
  Alpha: "\u0391",
  Beta: "\u0392",
  Gamma: "\u0393",
  Delta: "\u0394",
  Epsilon: "\u0395",
  Zeta: "\u0396",
  Eta: "\u0397",
  Theta: "\u0398",
  Iota: "\u0399",
  Kappa: "\u039A",
  Lambda: "\u039B",
  Mu: "\u039C",
  Nu: "\u039D",
  Xi: "\u039E",
  Omicron: "\u039F",
  Pi: "\u03A0",
  Rho: "\u03A1",
  Sigma: "\u03A3",
  Tau: "\u03A4",
  Upsilon: "\u03A5",
  Phi: "\u03A6",
  Chi: "\u03A7",
  Psi: "\u03A8",
  Omega: "\u03A9",
  alpha: "\u03B1",
  beta: "\u03B2",
  gamma: "\u03B3",
  delta: "\u03B4",
  epsilon: "\u03B5",
  zeta: "\u03B6",
  eta: "\u03B7",
  theta: "\u03B8",
  iota: "\u03B9",
  kappa: "\u03BA",
  lambda: "\u03BB",
  mu: "\u03BC",
  nu: "\u03BD",
  xi: "\u03BE",
  omicron: "\u03BF",
  pi: "\u03C0",
  rho: "\u03C1",
  sigmaf: "\u03C2",
  sigma: "\u03C3",
  tau: "\u03C4",
  upsilon: "\u03C5",
  phi: "\u03C6",
  chi: "\u03C7",
  psi: "\u03C8",
  omega: "\u03C9",
  thetasym: "\u03D1",
  upsih: "\u03D2",
  piv: "\u03D6",
  ensp: "\u2002",
  emsp: "\u2003",
  thinsp: "\u2009",
  zwnj: "\u200C",
  zwj: "\u200D",
  lrm: "\u200E",
  rlm: "\u200F",
  ndash: "\u2013",
  mdash: "\u2014",
  lsquo: "\u2018",
  rsquo: "\u2019",
  sbquo: "\u201A",
  ldquo: "\u201C",
  rdquo: "\u201D",
  bdquo: "\u201E",
  dagger: "\u2020",
  Dagger: "\u2021",
  bull: "\u2022",
  hellip: "\u2026",
  permil: "\u2030",
  prime: "\u2032",
  Prime: "\u2033",
  lsaquo: "\u2039",
  rsaquo: "\u203A",
  oline: "\u203E",
  frasl: "\u2044",
  euro: "\u20AC",
  image: "\u2111",
  weierp: "\u2118",
  real: "\u211C",
  trade: "\u2122",
  alefsym: "\u2135",
  larr: "\u2190",
  uarr: "\u2191",
  rarr: "\u2192",
  darr: "\u2193",
  harr: "\u2194",
  crarr: "\u21B5",
  lArr: "\u21D0",
  uArr: "\u21D1",
  rArr: "\u21D2",
  dArr: "\u21D3",
  hArr: "\u21D4",
  forall: "\u2200",
  part: "\u2202",
  exist: "\u2203",
  empty: "\u2205",
  nabla: "\u2207",
  isin: "\u2208",
  notin: "\u2209",
  ni: "\u220B",
  prod: "\u220F",
  sum: "\u2211",
  minus: "\u2212",
  lowast: "\u2217",
  radic: "\u221A",
  prop: "\u221D",
  infin: "\u221E",
  ang: "\u2220",
  and: "\u2227",
  or: "\u2228",
  cap: "\u2229",
  cup: "\u222A",
  int: "\u222B",
  there4: "\u2234",
  sim: "\u223C",
  cong: "\u2245",
  asymp: "\u2248",
  ne: "\u2260",
  equiv: "\u2261",
  le: "\u2264",
  ge: "\u2265",
  sub: "\u2282",
  sup: "\u2283",
  nsub: "\u2284",
  sube: "\u2286",
  supe: "\u2287",
  oplus: "\u2295",
  otimes: "\u2297",
  perp: "\u22A5",
  sdot: "\u22C5",
  lceil: "\u2308",
  rceil: "\u2309",
  lfloor: "\u230A",
  rfloor: "\u230B",
  lang: "\u2329",
  rang: "\u232A",
  loz: "\u25CA",
  spades: "\u2660",
  clubs: "\u2663",
  hearts: "\u2665",
  diams: "\u2666"
};
var lineBreak = /\r\n|[\r\n\u2028\u2029]/;
var lineBreakG = new RegExp(lineBreak.source, "g");
function isNewLine(code2) {
  switch (code2) {
    case 10:
    case 13:
    case 8232:
    case 8233:
      return true;
    default:
      return false;
  }
}
function hasNewLine(input, start, end) {
  for (let i = start; i < end; i++) {
    if (isNewLine(input.charCodeAt(i))) {
      return true;
    }
  }
  return false;
}
var skipWhiteSpace = /(?:\s|\/\/.*|\/\*[^]*?\*\/)*/g;
var skipWhiteSpaceInLine = /(?:[^\S\n\r\u2028\u2029]|\/\/.*|\/\*.*?\*\/)*/g;
function isWhitespace(code2) {
  switch (code2) {
    case 9:
    case 11:
    case 12:
    case 32:
    case 160:
    case 5760:
    case 8192:
    case 8193:
    case 8194:
    case 8195:
    case 8196:
    case 8197:
    case 8198:
    case 8199:
    case 8200:
    case 8201:
    case 8202:
    case 8239:
    case 8287:
    case 12288:
    case 65279:
      return true;
    default:
      return false;
  }
}
var JsxErrorTemplates = {
  AttributeIsEmpty: "JSX attributes must only be assigned a non-empty expression.",
  MissingClosingTagElement: ({
    openingTagName
  }) => `Expected corresponding JSX closing tag for <${openingTagName}>.`,
  MissingClosingTagFragment: "Expected corresponding JSX closing tag for <>.",
  UnexpectedSequenceExpression: "Sequence expressions cannot be directly nested inside JSX. Did you mean to wrap it in parentheses (...)?",
  UnexpectedToken: ({
    unexpected,
    HTMLEntity
  }) => `Unexpected token \`${unexpected}\`. Did you mean \`${HTMLEntity}\` or \`{'${unexpected}'}\`?`,
  UnsupportedJsxValue: "JSX value should be either an expression or a quoted JSX text.",
  UnterminatedJsxContent: "Unterminated JSX contents.",
  UnwrappedAdjacentJSXElements: "Adjacent JSX elements must be wrapped in an enclosing tag. Did you want a JSX fragment <>...</>?"
};
var JsxErrors = ParseErrorEnum`jsx`(JsxErrorTemplates);
function isFragment(object) {
  return object ? object.type === "JSXOpeningFragment" || object.type === "JSXClosingFragment" : false;
}
function getQualifiedJSXName(object) {
  if (object.type === "JSXIdentifier") {
    return object.name;
  }
  if (object.type === "JSXNamespacedName") {
    return object.namespace.name + ":" + object.name.name;
  }
  if (object.type === "JSXMemberExpression") {
    return getQualifiedJSXName(object.object) + "." + getQualifiedJSXName(object.property);
  }
  throw new Error("Node had unexpected type: " + object.type);
}
var jsx = (superClass) => class JSXParserMixin extends superClass {
  jsxReadToken() {
    let out = "";
    let chunkStart = this.state.pos;
    for (; ; ) {
      if (this.state.pos >= this.length) {
        throw this.raise(JsxErrors.UnterminatedJsxContent, this.state.startLoc);
      }
      const ch = this.input.charCodeAt(this.state.pos);
      switch (ch) {
        case 60:
        case 123:
          if (this.state.pos === this.state.start) {
            if (ch === 60 && this.state.canStartJSXElement) {
              ++this.state.pos;
              this.finishToken(138);
            } else {
              super.getTokenFromCode(ch);
            }
            return;
          }
          out += this.input.slice(chunkStart, this.state.pos);
          this.finishToken(137, out);
          return;
        case 38:
          out += this.input.slice(chunkStart, this.state.pos);
          out += this.jsxReadEntity();
          chunkStart = this.state.pos;
          break;
        case 62:
        case 125:
          this.raise(JsxErrors.UnexpectedToken, this.state.curPosition(), {
            unexpected: this.input[this.state.pos],
            HTMLEntity: ch === 125 ? "&rbrace;" : "&gt;"
          });
        default:
          if (isNewLine(ch)) {
            out += this.input.slice(chunkStart, this.state.pos);
            out += this.jsxReadNewLine(true);
            chunkStart = this.state.pos;
          } else {
            ++this.state.pos;
          }
      }
    }
  }
  jsxReadNewLine(normalizeCRLF) {
    const ch = this.input.charCodeAt(this.state.pos);
    let out;
    ++this.state.pos;
    if (ch === 13 && this.input.charCodeAt(this.state.pos) === 10) {
      ++this.state.pos;
      out = normalizeCRLF ? "\n" : "\r\n";
    } else {
      out = String.fromCharCode(ch);
    }
    ++this.state.curLine;
    this.state.lineStart = this.state.pos;
    return out;
  }
  jsxReadString(quote) {
    let out = "";
    let chunkStart = ++this.state.pos;
    for (; ; ) {
      if (this.state.pos >= this.length) {
        throw this.raise(Errors.UnterminatedString, this.state.startLoc);
      }
      const ch = this.input.charCodeAt(this.state.pos);
      if (ch === quote) break;
      if (ch === 38) {
        out += this.input.slice(chunkStart, this.state.pos);
        out += this.jsxReadEntity();
        chunkStart = this.state.pos;
      } else if (isNewLine(ch)) {
        out += this.input.slice(chunkStart, this.state.pos);
        out += this.jsxReadNewLine(false);
        chunkStart = this.state.pos;
      } else {
        ++this.state.pos;
      }
    }
    out += this.input.slice(chunkStart, this.state.pos++);
    this.finishToken(130, out);
  }
  jsxReadEntity() {
    const startPos = ++this.state.pos;
    if (this.codePointAtPos(this.state.pos) === 35) {
      ++this.state.pos;
      let radix = 10;
      if (this.codePointAtPos(this.state.pos) === 120) {
        radix = 16;
        ++this.state.pos;
      }
      const codePoint = this.readInt(radix, void 0, false, "bail");
      if (codePoint !== null && this.codePointAtPos(this.state.pos) === 59) {
        ++this.state.pos;
        return String.fromCodePoint(codePoint);
      }
    } else {
      let count = 0;
      let semi = false;
      while (count++ < 10 && this.state.pos < this.length && !(semi = this.codePointAtPos(this.state.pos) === 59)) {
        ++this.state.pos;
      }
      if (semi) {
        const desc = this.input.slice(startPos, this.state.pos);
        const entity = entities[desc];
        ++this.state.pos;
        if (entity) {
          return entity;
        }
      }
    }
    this.state.pos = startPos;
    return "&";
  }
  jsxReadWord() {
    let ch;
    const start = this.state.pos;
    do {
      ch = this.input.charCodeAt(++this.state.pos);
    } while (isIdentifierChar(ch) || ch === 45);
    this.finishToken(136, this.input.slice(start, this.state.pos));
  }
  jsxParseIdentifier() {
    const node = this.startNode();
    if (this.match(136)) {
      node.name = this.state.value;
    } else if (tokenIsKeyword(this.state.type)) {
      node.name = tokenLabelName(this.state.type);
    } else {
      this.unexpected();
    }
    this.next();
    return this.finishNode(node, "JSXIdentifier");
  }
  jsxParseNamespacedName() {
    const startLoc = this.state.startLoc;
    const name = this.jsxParseIdentifier();
    if (!this.eat(10)) return name;
    const node = this.startNodeAt(startLoc);
    node.namespace = name;
    node.name = this.jsxParseIdentifier();
    return this.finishNode(node, "JSXNamespacedName");
  }
  jsxParseElementName() {
    const startLoc = this.state.startLoc;
    let node = this.jsxParseNamespacedName();
    if (node.type === "JSXNamespacedName") {
      return node;
    }
    while (this.eat(12)) {
      const newNode = this.startNodeAt(startLoc);
      newNode.object = node;
      newNode.property = this.jsxParseIdentifier();
      node = this.finishNode(newNode, "JSXMemberExpression");
    }
    return node;
  }
  jsxParseAttributeValue() {
    let node;
    switch (this.state.type) {
      case 2:
        node = this.startNode();
        this.setContext(types.brace);
        this.next();
        node = this.jsxParseExpressionContainer(node, types.j_oTag);
        if (node.expression.type === "JSXEmptyExpression") {
          this.raise(JsxErrors.AttributeIsEmpty, node);
        }
        return node;
      case 138:
      case 130:
        return this.parseExprAtom();
      default:
        throw this.raise(JsxErrors.UnsupportedJsxValue, this.state.startLoc);
    }
  }
  jsxParseEmptyExpression() {
    const node = this.startNodeAt(this.state.lastTokEndLoc);
    return this.finishNodeAt(node, "JSXEmptyExpression", this.state.startLoc);
  }
  jsxParseSpreadChild(node) {
    this.next();
    node.expression = this.parseExpression();
    this.setContext(types.j_expr);
    this.state.canStartJSXElement = true;
    this.expect(4);
    return this.finishNode(node, "JSXSpreadChild");
  }
  jsxParseExpressionContainer(node, previousContext) {
    if (this.match(4)) {
      node.expression = this.jsxParseEmptyExpression();
    } else {
      const expression = this.parseExpression();
      if (expression.type === "SequenceExpression" && !expression.extra?.parenthesized) {
        this.raise(JsxErrors.UnexpectedSequenceExpression, expression.expressions[1]);
      }
      node.expression = expression;
    }
    this.setContext(previousContext);
    this.state.canStartJSXElement = true;
    this.expect(4);
    return this.finishNode(node, "JSXExpressionContainer");
  }
  jsxParseAttribute() {
    if (this.match(2)) {
      const node2 = this.startNode();
      this.setContext(types.brace);
      this.next();
      this.expect(17);
      node2.argument = this.parseMaybeAssignAllowIn();
      this.setContext(types.j_oTag);
      this.state.canStartJSXElement = true;
      this.expect(4);
      return this.finishNode(node2, "JSXSpreadAttribute");
    }
    const node = this.startNode();
    node.name = this.jsxParseNamespacedName();
    node.value = this.eat(25) ? this.jsxParseAttributeValue() : null;
    return this.finishNode(node, "JSXAttribute");
  }
  jsxParseOpeningElementAt(startLoc) {
    if (this.eat(139)) {
      const node2 = this.startNodeAt(startLoc);
      return this.finishNode(node2, "JSXOpeningFragment");
    }
    const node = this.startNodeAt(startLoc);
    node.name = this.jsxParseElementName();
    return this.jsxParseOpeningElementAfterName(node);
  }
  jsxParseOpeningElementAfterName(node) {
    const attributes = [];
    while (!this.match(52) && !this.match(139)) {
      attributes.push(this.jsxParseAttribute());
    }
    node.attributes = attributes;
    node.selfClosing = this.eat(52);
    this.expect(139);
    return this.finishNode(node, "JSXOpeningElement");
  }
  jsxParseClosingElementAt(startLoc) {
    if (this.eat(139)) {
      const node2 = this.startNodeAt(startLoc);
      return this.finishNode(node2, "JSXClosingFragment");
    }
    const node = this.startNodeAt(startLoc);
    node.name = this.jsxParseElementName();
    this.expect(139);
    return this.finishNode(node, "JSXClosingElement");
  }
  jsxParseElementAt(startLoc) {
    const node = this.startNodeAt(startLoc);
    const children = [];
    const openingElement = this.jsxParseOpeningElementAt(startLoc);
    let closingElement = null;
    if (!openingElement.selfClosing) {
      contents: for (; ; ) {
        switch (this.state.type) {
          case 138:
            startLoc = this.state.startLoc;
            this.next();
            if (this.eat(52)) {
              this.setLoc(startLoc);
              closingElement = this.jsxParseClosingElementAt(startLoc);
              break contents;
            }
            children.push(this.jsxParseElementAt(startLoc));
            break;
          case 137:
            children.push(this.parseLiteral(this.state.value, "JSXText"));
            break;
          case 2: {
            const node2 = this.startNode();
            this.setContext(types.brace);
            this.next();
            if (this.match(17)) {
              children.push(this.jsxParseSpreadChild(node2));
            } else {
              children.push(this.jsxParseExpressionContainer(node2, types.j_expr));
            }
            break;
          }
          default:
            this.unexpected();
        }
      }
      if (isFragment(openingElement) && !isFragment(closingElement) && closingElement !== null) {
        this.raise(JsxErrors.MissingClosingTagFragment, closingElement);
      } else if (!isFragment(openingElement) && isFragment(closingElement)) {
        this.raise(JsxErrors.MissingClosingTagElement, closingElement, {
          openingTagName: getQualifiedJSXName(openingElement.name)
        });
      } else if (!isFragment(openingElement) && !isFragment(closingElement)) {
        if (getQualifiedJSXName(closingElement.name) !== getQualifiedJSXName(openingElement.name)) {
          this.raise(JsxErrors.MissingClosingTagElement, closingElement, {
            openingTagName: getQualifiedJSXName(openingElement.name)
          });
        }
      }
    }
    if (isFragment(openingElement)) {
      node.openingFragment = openingElement;
      node.closingFragment = closingElement;
    } else {
      node.openingElement = openingElement;
      node.closingElement = closingElement;
    }
    node.children = children;
    if (this.match(43)) {
      throw this.raise(JsxErrors.UnwrappedAdjacentJSXElements, this.state.startLoc);
    }
    return isFragment(openingElement) ? this.finishNode(node, "JSXFragment") : this.finishNode(node, "JSXElement");
  }
  jsxParseElement() {
    const startLoc = this.state.startLoc;
    this.next();
    return this.jsxParseElementAt(startLoc);
  }
  setContext(newContext) {
    const {
      context
    } = this.state;
    context[context.length - 1] = newContext;
  }
  parseExprAtom(refExpressionErrors) {
    if (this.match(138)) {
      return this.jsxParseElement();
    } else if (this.match(43) && this.input.charCodeAt(this.state.pos) !== 33) {
      this.replaceToken(138);
      return this.jsxParseElement();
    } else {
      return super.parseExprAtom(refExpressionErrors);
    }
  }
  skipSpace() {
    const curContext = this.curContext();
    if (!curContext.preserveSpace) super.skipSpace();
  }
  getTokenFromCode(code2) {
    const context = this.curContext();
    if (context === types.j_expr) {
      this.jsxReadToken();
      return;
    }
    if (context === types.j_oTag || context === types.j_cTag) {
      if (isIdentifierStart(code2)) {
        this.jsxReadWord();
        return;
      }
      if (code2 === 62) {
        ++this.state.pos;
        this.finishToken(139);
        return;
      }
      if ((code2 === 34 || code2 === 39) && context === types.j_oTag) {
        this.jsxReadString(code2);
        return;
      }
    }
    if (code2 === 60 && this.state.canStartJSXElement && this.input.charCodeAt(this.state.pos + 1) !== 33) {
      ++this.state.pos;
      this.finishToken(138);
      return;
    }
    super.getTokenFromCode(code2);
  }
  updateContext(prevType) {
    const {
      context,
      type
    } = this.state;
    if (type === 52 && prevType === 138) {
      context.splice(-2, 2, types.j_cTag);
      this.state.canStartJSXElement = false;
    } else if (type === 138) {
      context.push(types.j_oTag);
    } else if (type === 139) {
      const out = context[context.length - 1];
      if (out === types.j_oTag && prevType === 52 || out === types.j_cTag) {
        context.pop();
        this.state.canStartJSXElement = context[context.length - 1] === types.j_expr;
      } else {
        this.setContext(types.j_expr);
        this.state.canStartJSXElement = true;
      }
    } else {
      this.state.canStartJSXElement = tokenComesBeforeExpression(type);
    }
  }
};
var TypeScriptScope = class extends Scope {
  tsNames = /* @__PURE__ */ new Map();
};
var TypeScriptScopeHandler = class extends ScopeHandler {
  get inTSNamespace() {
    const scopeStack = this.scopeStack;
    return scopeStack.length >= 2 && scopeStack[scopeStack.length - 1].flags === 0 && (scopeStack[scopeStack.length - 2].flags & 2048) > 0;
  }
  importsStack = [];
  createScope(flags) {
    this.importsStack.push(/* @__PURE__ */ new Set());
    return new TypeScriptScope(flags);
  }
  enter(flags) {
    if (flags & (1024 | 2048)) {
      this.importsStack.push(/* @__PURE__ */ new Set());
    }
    super.enter(flags);
  }
  exit() {
    const flags = super.exit();
    if (flags & (1024 | 2048)) {
      this.importsStack.pop();
    }
    return flags;
  }
  hasImport(name, allowShadow) {
    const len = this.importsStack.length;
    if (this.importsStack[len - 1].has(name)) {
      return true;
    }
    if (!allowShadow && len > 1) {
      for (let i = 0; i < len - 1; i++) {
        if (this.importsStack[i].has(name)) return true;
      }
    }
    return false;
  }
  declareName(name, bindingType, loc) {
    if (bindingType & 4096) {
      if (this.hasImport(name, true)) {
        this.parser.raise(Errors.VarRedeclaration, loc, {
          identifierName: name
        });
      }
      this.importsStack[this.importsStack.length - 1].add(name);
      return;
    }
    const scope = this.currentScope();
    let type = scope.tsNames.get(name) || 0;
    if (bindingType & 1024) {
      this.maybeExportDefined(scope, name);
      scope.tsNames.set(name, type | 16);
      return;
    }
    super.declareName(name, bindingType, loc);
    if (bindingType & 2) {
      if (!(bindingType & 1)) {
        this.checkRedeclarationInScope(scope, name, bindingType, loc);
        this.maybeExportDefined(scope, name);
      }
      type = type | 1;
    }
    if (bindingType & 256) {
      type = type | 2;
    }
    if (bindingType & 512) {
      type = type | 4;
    }
    if (bindingType & 128) {
      type = type | 8;
    }
    if (type) scope.tsNames.set(name, type);
  }
  isRedeclaredInScope(scope, name, bindingType) {
    const type = scope.tsNames.get(name);
    if ((type & 2) > 0) {
      if (bindingType & 256) {
        const isConst = (bindingType & 512) > 0;
        const wasConst = (type & 4) > 0;
        return isConst !== wasConst;
      }
      return true;
    }
    if (bindingType & 128 && (type & 8) > 0) {
      if (scope.names.get(name) & 2) {
        return !!(bindingType & 1);
      } else {
        return false;
      }
    }
    if (bindingType & 2 && (type & 1) > 0) {
      return true;
    }
    return super.isRedeclaredInScope(scope, name, bindingType);
  }
  checkLocalExport(id) {
    const {
      name
    } = id;
    if (this.hasImport(name)) return;
    const len = this.scopeStack.length;
    for (let i = len - 1; i >= 0; i--) {
      const scope = this.scopeStack[i];
      const type = scope.tsNames.get(name);
      if ((type & 1) > 0 || (type & 16) > 0) {
        return;
      }
    }
    super.checkLocalExport(id);
  }
};
var BaseParser = class {
  sawUnambiguousESM = false;
  ambiguousScriptDifferentAst = false;
  sourceToOffsetPos(sourcePos) {
    return sourcePos + this.startIndex;
  }
  offsetToSourcePos(offsetPos) {
    return offsetPos - this.startIndex;
  }
  hasPlugin(pluginConfig) {
    if (typeof pluginConfig === "string") {
      return this.plugins.has(pluginConfig);
    } else {
      const [pluginName, pluginOptions] = pluginConfig;
      if (!this.hasPlugin(pluginName)) {
        return false;
      }
      const actualOptions = this.plugins.get(pluginName);
      for (const key of Object.keys(pluginOptions)) {
        if (actualOptions?.[key] !== pluginOptions[key]) {
          return false;
        }
      }
      return true;
    }
  }
  getPluginOption(plugin, name) {
    return this.plugins.get(plugin)?.[name];
  }
};
function setTrailingComments(node, comments) {
  if (node.trailingComments === void 0) {
    node.trailingComments = comments;
  } else {
    node.trailingComments.unshift(...comments);
  }
}
function setLeadingComments(node, comments) {
  if (node.leadingComments === void 0) {
    node.leadingComments = comments;
  } else {
    node.leadingComments.unshift(...comments);
  }
}
function setInnerComments(node, comments) {
  if (node.innerComments === void 0) {
    node.innerComments = comments;
  } else {
    node.innerComments.unshift(...comments);
  }
}
function adjustInnerComments(node, elements, commentWS) {
  let lastElement = null;
  let i = elements.length;
  while (lastElement === null && i > 0) {
    lastElement = elements[--i];
  }
  if (lastElement === null || lastElement.start > commentWS.start) {
    setInnerComments(node, commentWS.comments);
  } else {
    setTrailingComments(lastElement, commentWS.comments);
  }
}
var CommentsParser = class extends BaseParser {
  addComment(comment) {
    if (this.filename) comment.loc.filename = this.filename;
    const {
      commentsLen
    } = this.state;
    if (this.comments.length !== commentsLen) {
      this.comments.length = commentsLen;
    }
    this.comments.push(comment);
    this.state.commentsLen++;
  }
  processComment(node) {
    const {
      commentStack
    } = this.state;
    const commentStackLength = commentStack.length;
    if (commentStackLength === 0) return;
    let i = commentStackLength - 1;
    const lastCommentWS = commentStack[i];
    if (lastCommentWS.start === node.end) {
      lastCommentWS.leadingNode = node;
      i--;
    }
    const nodeStart = node.start;
    for (; i >= 0; i--) {
      const commentWS = commentStack[i];
      const commentEnd = commentWS.end;
      if (commentEnd > nodeStart) {
        commentWS.containingNode = node;
        this.finalizeComment(commentWS);
        commentStack.splice(i, 1);
      } else {
        if (commentEnd === nodeStart) {
          commentWS.trailingNode = node;
        }
        break;
      }
    }
  }
  finalizeComment(commentWS) {
    const {
      comments
    } = commentWS;
    if (commentWS.leadingNode !== null || commentWS.trailingNode !== null) {
      if (commentWS.leadingNode !== null) {
        setTrailingComments(commentWS.leadingNode, comments);
      }
      if (commentWS.trailingNode !== null) {
        setLeadingComments(commentWS.trailingNode, comments);
      }
    } else {
      const node = commentWS.containingNode;
      const commentStart = commentWS.start;
      if (this.input.charCodeAt(this.offsetToSourcePos(commentStart) - 1) === 44) {
        switch (node.type) {
          case "ObjectExpression":
          case "ObjectPattern":
            adjustInnerComments(node, node.properties, commentWS);
            break;
          case "CallExpression":
          case "NewExpression":
          case "OptionalCallExpression":
            adjustInnerComments(node, node.arguments, commentWS);
            break;
          case "ImportExpression":
            adjustInnerComments(node, [node.source, node.options ?? null], commentWS);
            break;
          case "FunctionDeclaration":
          case "FunctionExpression":
          case "ArrowFunctionExpression":
          case "ObjectMethod":
          case "ClassMethod":
          case "ClassPrivateMethod":
          case "TSTypeParameterDeclaration":
            adjustInnerComments(node, node.params, commentWS);
            break;
          case "ArrayExpression":
          case "ArrayPattern":
            adjustInnerComments(node, node.elements, commentWS);
            break;
          case "ExportNamedDeclaration":
          case "ImportDeclaration":
            adjustInnerComments(node, node.specifiers, commentWS);
            break;
          case "TSEnumBody":
            adjustInnerComments(node, node.members, commentWS);
            break;
          case "TSInterfaceBody":
            adjustInnerComments(node, node.body, commentWS);
            break;
          default: {
            setInnerComments(node, comments);
          }
        }
      } else {
        setInnerComments(node, comments);
      }
    }
  }
  finalizeRemainingComments() {
    const {
      commentStack
    } = this.state;
    for (let i = commentStack.length - 1; i >= 0; i--) {
      this.finalizeComment(commentStack[i]);
    }
    this.state.commentStack = [];
  }
  resetPreviousNodeTrailingComments(node) {
    const {
      commentStack
    } = this.state;
    const {
      length
    } = commentStack;
    if (length === 0) return;
    const commentWS = commentStack[length - 1];
    if (commentWS.leadingNode === node) {
      commentWS.leadingNode = null;
    }
  }
  takeSurroundingComments(node, start, end) {
    const {
      commentStack
    } = this.state;
    const commentStackLength = commentStack.length;
    if (commentStackLength === 0) return;
    let i = commentStackLength - 1;
    for (; i >= 0; i--) {
      const commentWS = commentStack[i];
      const commentEnd = commentWS.end;
      const commentStart = commentWS.start;
      if (commentStart === end) {
        commentWS.leadingNode = node;
      } else if (commentEnd === start) {
        commentWS.trailingNode = node;
      } else if (commentEnd < start) {
        break;
      }
    }
  }
};
var State = class _State {
  flags = 2048;
  get strict() {
    return (this.flags & 1) > 0;
  }
  set strict(v) {
    if (v) this.flags |= 1;
    else this.flags &= -2;
  }
  startIndex;
  curLine;
  lineStart;
  startLoc;
  endLoc;
  init({
    strictMode,
    sourceType,
    startIndex,
    startLine,
    startColumn
  }) {
    this.strict = strictMode === false ? false : strictMode === true ? true : sourceType === "module";
    this.startIndex = startIndex;
    this.curLine = startLine;
    this.lineStart = -startColumn;
    this.startLoc = this.endLoc = new Position(startLine, startColumn, startIndex);
  }
  errors = [];
  noArrowAt = [];
  noArrowParamsConversionAt = [];
  get canStartArrow() {
    return (this.flags & 2) > 0;
  }
  set canStartArrow(v) {
    if (v) this.flags |= 2;
    else this.flags &= -3;
  }
  get inType() {
    return (this.flags & 4) > 0;
  }
  set inType(v) {
    if (v) this.flags |= 4;
    else this.flags &= -5;
  }
  get noAnonFunctionType() {
    return (this.flags & 8) > 0;
  }
  set noAnonFunctionType(v) {
    if (v) this.flags |= 8;
    else this.flags &= -9;
  }
  get hasFlowComment() {
    return (this.flags & 16) > 0;
  }
  set hasFlowComment(v) {
    if (v) this.flags |= 16;
    else this.flags &= -17;
  }
  get isAmbientContext() {
    return (this.flags & 32) > 0;
  }
  set isAmbientContext(v) {
    if (v) this.flags |= 32;
    else this.flags &= -33;
  }
  get inAbstractClass() {
    return (this.flags & 64) > 0;
  }
  set inAbstractClass(v) {
    if (v) this.flags |= 64;
    else this.flags &= -65;
  }
  get inDisallowConditionalTypesContext() {
    return (this.flags & 128) > 0;
  }
  set inDisallowConditionalTypesContext(v) {
    if (v) this.flags |= 128;
    else this.flags &= -129;
  }
  get inConditionalConsequent() {
    return (this.flags & 256) > 0;
  }
  set inConditionalConsequent(v) {
    if (v) this.flags |= 256;
    else this.flags &= -257;
  }
  get inHackPipelineBody() {
    return (this.flags & 512) > 0;
  }
  set inHackPipelineBody(v) {
    if (v) this.flags |= 512;
    else this.flags &= -513;
  }
  get seenTopicReference() {
    return (this.flags & 1024) > 0;
  }
  set seenTopicReference(v) {
    if (v) this.flags |= 1024;
    else this.flags &= -1025;
  }
  labels = [];
  commentsLen = 0;
  commentStack = [];
  pos = 0;
  type = 135;
  value = null;
  start = 0;
  end = 0;
  lastTokEndLoc = null;
  lastTokStartLoc = null;
  context = [types.brace];
  get canStartJSXElement() {
    return (this.flags & 2048) > 0;
  }
  set canStartJSXElement(v) {
    if (v) this.flags |= 2048;
    else this.flags &= -2049;
  }
  get containsEsc() {
    return (this.flags & 4096) > 0;
  }
  set containsEsc(v) {
    if (v) this.flags |= 4096;
    else this.flags &= -4097;
  }
  firstInvalidTemplateEscapePos = null;
  get hasTopLevelAwait() {
    return (this.flags & 8192) > 0;
  }
  set hasTopLevelAwait(v) {
    if (v) this.flags |= 8192;
    else this.flags &= -8193;
  }
  strictErrors = /* @__PURE__ */ new Map();
  tokensLength = 0;
  curPosition() {
    return new Position(this.curLine, this.pos - this.lineStart, this.pos + this.startIndex);
  }
  clone() {
    const state = new _State();
    state.flags = this.flags;
    state.startIndex = this.startIndex;
    state.curLine = this.curLine;
    state.lineStart = this.lineStart;
    state.startLoc = this.startLoc;
    state.endLoc = this.endLoc;
    state.errors = this.errors.slice();
    state.noArrowAt = this.noArrowAt.slice();
    state.noArrowParamsConversionAt = this.noArrowParamsConversionAt.slice();
    state.labels = this.labels.slice();
    state.commentsLen = this.commentsLen;
    state.commentStack = this.commentStack.slice();
    state.pos = this.pos;
    state.type = this.type;
    state.value = this.value;
    state.start = this.start;
    state.end = this.end;
    state.lastTokEndLoc = this.lastTokEndLoc;
    state.lastTokStartLoc = this.lastTokStartLoc;
    state.context = this.context.slice();
    state.firstInvalidTemplateEscapePos = this.firstInvalidTemplateEscapePos;
    state.strictErrors = this.strictErrors;
    state.tokensLength = this.tokensLength;
    return state;
  }
};
var _isDigit = function isDigit(code2) {
  return code2 >= 48 && code2 <= 57;
};
var forbiddenNumericSeparatorSiblings = {
  decBinOct: /* @__PURE__ */ new Set([46, 66, 69, 79, 95, 98, 101, 111]),
  hex: /* @__PURE__ */ new Set([46, 88, 95, 120])
};
var isAllowedNumericSeparatorSibling = {
  bin: (ch) => ch === 48 || ch === 49,
  oct: (ch) => ch >= 48 && ch <= 55,
  dec: (ch) => ch >= 48 && ch <= 57,
  hex: (ch) => ch >= 48 && ch <= 57 || ch >= 65 && ch <= 70 || ch >= 97 && ch <= 102
};
function readStringContents(type, input, pos, lineStart, curLine, errors) {
  const initialPos = pos;
  const initialLineStart = lineStart;
  const initialCurLine = curLine;
  let out = "";
  let firstInvalidLoc = null;
  let chunkStart = pos;
  const {
    length
  } = input;
  for (; ; ) {
    if (pos >= length) {
      errors.unterminated(initialPos, initialLineStart, initialCurLine);
      out += input.slice(chunkStart, pos);
      break;
    }
    const ch = input.charCodeAt(pos);
    if (isStringEnd(type, ch, input, pos)) {
      out += input.slice(chunkStart, pos);
      break;
    }
    if (ch === 92) {
      out += input.slice(chunkStart, pos);
      const res = readEscapedChar(input, pos, lineStart, curLine, type === "template", errors);
      if (res.ch === null && !firstInvalidLoc) {
        firstInvalidLoc = {
          pos,
          lineStart,
          curLine
        };
      } else {
        out += res.ch;
      }
      ({
        pos,
        lineStart,
        curLine
      } = res);
      chunkStart = pos;
    } else if (ch === 8232 || ch === 8233) {
      ++pos;
      ++curLine;
      lineStart = pos;
    } else if (ch === 10 || ch === 13) {
      if (type === "template") {
        out += input.slice(chunkStart, pos) + "\n";
        ++pos;
        if (ch === 13 && input.charCodeAt(pos) === 10) {
          ++pos;
        }
        ++curLine;
        chunkStart = lineStart = pos;
      } else {
        errors.unterminated(initialPos, initialLineStart, initialCurLine);
      }
    } else {
      ++pos;
    }
  }
  return {
    pos,
    str: out,
    firstInvalidLoc,
    lineStart,
    curLine
  };
}
function isStringEnd(type, ch, input, pos) {
  if (type === "template") {
    return ch === 96 || ch === 36 && input.charCodeAt(pos + 1) === 123;
  }
  return ch === (type === "double" ? 34 : 39);
}
function readEscapedChar(input, pos, lineStart, curLine, inTemplate, errors) {
  const throwOnInvalid = !inTemplate;
  pos++;
  const res = (ch2) => ({
    pos,
    ch: ch2,
    lineStart,
    curLine
  });
  const ch = input.charCodeAt(pos++);
  switch (ch) {
    case 110:
      return res("\n");
    case 114:
      return res("\r");
    case 120: {
      let code2;
      ({
        code: code2,
        pos
      } = readHexChar(input, pos, lineStart, curLine, 2, false, throwOnInvalid, errors));
      return res(code2 === null ? null : String.fromCharCode(code2));
    }
    case 117: {
      let code2;
      ({
        code: code2,
        pos
      } = readCodePoint(input, pos, lineStart, curLine, throwOnInvalid, errors));
      return res(code2 === null ? null : String.fromCodePoint(code2));
    }
    case 116:
      return res("	");
    case 98:
      return res("\b");
    case 118:
      return res("\v");
    case 102:
      return res("\f");
    case 13:
      if (input.charCodeAt(pos) === 10) {
        ++pos;
      }
    case 10:
      lineStart = pos;
      ++curLine;
    case 8232:
    case 8233:
      return res("");
    case 56:
    case 57:
      if (inTemplate) {
        return res(null);
      } else {
        errors.strictNumericEscape(pos - 1, lineStart, curLine);
      }
    default:
      if (ch >= 48 && ch <= 55) {
        const startPos = pos - 1;
        const match = /^[0-7]+/.exec(input.slice(startPos, pos + 2));
        let octalStr = match[0];
        let octal = parseInt(octalStr, 8);
        if (octal > 255) {
          octalStr = octalStr.slice(0, -1);
          octal = parseInt(octalStr, 8);
        }
        pos += octalStr.length - 1;
        const next = input.charCodeAt(pos);
        if (octalStr !== "0" || next === 56 || next === 57) {
          if (inTemplate) {
            return res(null);
          } else {
            errors.strictNumericEscape(startPos, lineStart, curLine);
          }
        }
        return res(String.fromCharCode(octal));
      }
      return res(String.fromCharCode(ch));
  }
}
function readHexChar(input, pos, lineStart, curLine, len, forceLen, throwOnInvalid, errors) {
  const initialPos = pos;
  let n;
  ({
    n,
    pos
  } = readInt(input, pos, lineStart, curLine, 16, len, forceLen, false, errors, !throwOnInvalid));
  if (n === null) {
    if (throwOnInvalid) {
      errors.invalidEscapeSequence(initialPos, lineStart, curLine);
    } else {
      pos = initialPos - 1;
    }
  }
  return {
    code: n,
    pos
  };
}
function readInt(input, pos, lineStart, curLine, radix, len, forceLen, allowNumSeparator, errors, bailOnError) {
  const start = pos;
  const forbiddenSiblings = radix === 16 ? forbiddenNumericSeparatorSiblings.hex : forbiddenNumericSeparatorSiblings.decBinOct;
  const isAllowedSibling = radix === 16 ? isAllowedNumericSeparatorSibling.hex : radix === 10 ? isAllowedNumericSeparatorSibling.dec : radix === 8 ? isAllowedNumericSeparatorSibling.oct : isAllowedNumericSeparatorSibling.bin;
  let invalid = false;
  let total = 0;
  for (let i = 0, e = len == null ? Infinity : len; i < e; ++i) {
    const code2 = input.charCodeAt(pos);
    let val;
    if (code2 === 95 && allowNumSeparator !== "bail") {
      const prev = input.charCodeAt(pos - 1);
      const next = input.charCodeAt(pos + 1);
      if (!allowNumSeparator) {
        if (bailOnError) return {
          n: null,
          pos
        };
        errors.numericSeparatorInEscapeSequence(pos, lineStart, curLine);
      } else if (Number.isNaN(next) || !isAllowedSibling(next) || forbiddenSiblings.has(prev) || forbiddenSiblings.has(next)) {
        if (bailOnError) return {
          n: null,
          pos
        };
        errors.unexpectedNumericSeparator(pos, lineStart, curLine);
      }
      ++pos;
      continue;
    }
    if (code2 >= 97) {
      val = code2 - 97 + 10;
    } else if (code2 >= 65) {
      val = code2 - 65 + 10;
    } else if (_isDigit(code2)) {
      val = code2 - 48;
    } else {
      val = Infinity;
    }
    if (val >= radix) {
      if (val <= 9 && bailOnError) {
        return {
          n: null,
          pos
        };
      } else if (val <= 9 && errors.invalidDigit(pos, lineStart, curLine, radix)) {
        val = 0;
      } else if (forceLen) {
        val = 0;
        invalid = true;
      } else {
        break;
      }
    }
    ++pos;
    total = total * radix + val;
  }
  if (pos === start || len != null && pos - start !== len || invalid) {
    return {
      n: null,
      pos
    };
  }
  return {
    n: total,
    pos
  };
}
function readCodePoint(input, pos, lineStart, curLine, throwOnInvalid, errors) {
  const ch = input.charCodeAt(pos);
  let code2;
  if (ch === 123) {
    ++pos;
    ({
      code: code2,
      pos
    } = readHexChar(input, pos, lineStart, curLine, input.indexOf("}", pos) - pos, true, throwOnInvalid, errors));
    ++pos;
    if (code2 !== null && code2 > 1114111) {
      if (throwOnInvalid) {
        errors.invalidCodePoint(pos, lineStart, curLine);
      } else {
        return {
          code: null,
          pos
        };
      }
    }
  } else {
    ({
      code: code2,
      pos
    } = readHexChar(input, pos, lineStart, curLine, 4, false, throwOnInvalid, errors));
  }
  return {
    code: code2,
    pos
  };
}
function buildPosition(pos, lineStart, curLine) {
  return new Position(curLine, pos - lineStart, pos);
}
var VALID_REGEX_FLAGS = /* @__PURE__ */ new Set([103, 109, 115, 105, 121, 117, 100, 118]);
var Token = class {
  constructor(state) {
    const startIndex = state.startIndex || 0;
    this.type = state.type;
    this.value = state.value;
    this.start = startIndex + state.start;
    this.end = startIndex + state.end;
    this.loc = new SourceLocation(state.startLoc, state.endLoc);
  }
};
var locDataCache;
var Tokenizer = class extends CommentsParser {
  isLookahead;
  tokens = [];
  constructor(options, input) {
    super();
    this.state = new State();
    this.state.init(options);
    this.input = input;
    this.length = input.length;
    this.comments = [];
    this.isLookahead = false;
    if (!locDataCache || locDataCache.length < (this.length + 1) * 2) {
      locDataCache = new Uint32Array((this.length + 1) * 2);
    }
    this.locData = locDataCache;
  }
  setLoc(loc) {
    const dataIndex = this.offsetToSourcePos(loc.index);
    this.locData[dataIndex * 2] = loc.line;
    this.locData[dataIndex * 2 + 1] = loc.column;
  }
  getLoc(locIndex) {
    const dataIndex = this.offsetToSourcePos(locIndex);
    const loc = new Position(this.locData[dataIndex * 2], this.locData[dataIndex * 2 + 1], locIndex);
    return loc;
  }
  pushToken(token) {
    this.tokens.length = this.state.tokensLength;
    this.tokens.push(token);
    ++this.state.tokensLength;
  }
  next() {
    this.checkKeywordEscapes();
    if (this.optionFlags & 512) {
      this.pushToken(new Token(this.state));
    }
    this.state.lastTokEndLoc = this.state.endLoc;
    this.state.lastTokStartLoc = this.state.startLoc;
    this.nextToken();
  }
  eat(type) {
    if (this.match(type)) {
      this.next();
      return true;
    } else {
      return false;
    }
  }
  match(type) {
    return this.state.type === type;
  }
  createLookaheadState(state) {
    return {
      pos: state.pos,
      value: null,
      type: state.type,
      start: state.start,
      end: state.end,
      context: [this.curContext()],
      inType: state.inType,
      startLoc: state.startLoc,
      lastTokEndLoc: state.lastTokEndLoc,
      curLine: state.curLine,
      lineStart: state.lineStart,
      curPosition: state.curPosition
    };
  }
  lookahead() {
    const old = this.state;
    this.state = this.createLookaheadState(old);
    this.isLookahead = true;
    this.nextToken();
    this.isLookahead = false;
    const curr = this.state;
    this.state = old;
    return curr;
  }
  nextTokenStart() {
    return this.nextTokenStartSince(this.state.pos);
  }
  nextTokenStartSince(pos) {
    skipWhiteSpace.lastIndex = pos;
    return skipWhiteSpace.test(this.input) ? skipWhiteSpace.lastIndex : pos;
  }
  lookaheadCharCode() {
    return this.lookaheadCharCodeSince(this.state.pos);
  }
  lookaheadCharCodeSince(pos) {
    return this.input.charCodeAt(this.nextTokenStartSince(pos));
  }
  nextTokenInLineStart() {
    return this.nextTokenInLineStartSince(this.state.pos);
  }
  nextTokenInLineStartSince(pos) {
    skipWhiteSpaceInLine.lastIndex = pos;
    return skipWhiteSpaceInLine.test(this.input) ? skipWhiteSpaceInLine.lastIndex : pos;
  }
  lookaheadInLineCharCode() {
    return this.input.charCodeAt(this.nextTokenInLineStart());
  }
  codePointAtPos(pos) {
    let cp = this.input.charCodeAt(pos);
    if ((cp & 64512) === 55296 && ++pos < this.input.length) {
      const trail = this.input.charCodeAt(pos);
      if ((trail & 64512) === 56320) {
        cp = 65536 + ((cp & 1023) << 10) + (trail & 1023);
      }
    }
    return cp;
  }
  setStrict(strict) {
    this.state.strict = strict;
    if (strict) {
      this.state.strictErrors.forEach(([toParseError, at]) => this.raise(toParseError, at));
      this.state.strictErrors.clear();
    }
  }
  curContext() {
    return this.state.context[this.state.context.length - 1];
  }
  nextToken() {
    this.skipSpace();
    this.state.start = this.state.pos;
    if (!this.isLookahead) this.state.startLoc = this.state.curPosition();
    if (this.state.pos >= this.length) {
      this.finishToken(135);
      return;
    }
    this.getTokenFromCode(this.codePointAtPos(this.state.pos));
  }
  skipBlockComment(commentEnd) {
    let startLoc;
    if (!this.isLookahead) startLoc = this.state.curPosition();
    const start = this.state.pos;
    const end = this.input.indexOf(commentEnd, start + 2);
    if (end === -1) {
      throw this.raise(Errors.UnterminatedComment, this.state.curPosition());
    }
    this.state.pos = end + commentEnd.length;
    lineBreakG.lastIndex = start + 2;
    while (lineBreakG.test(this.input) && lineBreakG.lastIndex <= end) {
      ++this.state.curLine;
      this.state.lineStart = lineBreakG.lastIndex;
    }
    if (this.isLookahead) return;
    const comment = {
      type: "CommentBlock",
      value: this.input.slice(start + 2, end),
      start: this.sourceToOffsetPos(start),
      end: this.sourceToOffsetPos(end + commentEnd.length),
      loc: new SourceLocation(startLoc, this.state.curPosition())
    };
    if (this.optionFlags & 512) this.pushToken(comment);
    return comment;
  }
  skipLineComment(startSkip) {
    const start = this.state.pos;
    let startLoc;
    if (!this.isLookahead) startLoc = this.state.curPosition();
    let ch = this.input.charCodeAt(this.state.pos += startSkip);
    if (this.state.pos < this.length) {
      while (!isNewLine(ch) && ++this.state.pos < this.length) {
        ch = this.input.charCodeAt(this.state.pos);
      }
    }
    if (this.isLookahead) return;
    const end = this.state.pos;
    const value = this.input.slice(start + startSkip, end);
    const comment = {
      type: "CommentLine",
      value,
      start: this.sourceToOffsetPos(start),
      end: this.sourceToOffsetPos(end),
      loc: new SourceLocation(startLoc, this.state.curPosition())
    };
    if (this.optionFlags & 512) this.pushToken(comment);
    return comment;
  }
  skipSpace() {
    const spaceStart = this.state.pos;
    const comments = this.optionFlags & 8192 ? [] : null;
    loop: while (this.state.pos < this.length) {
      const ch = this.input.charCodeAt(this.state.pos);
      switch (ch) {
        case 32:
        case 160:
        case 9:
          ++this.state.pos;
          break;
        case 13:
          if (this.input.charCodeAt(this.state.pos + 1) === 10) {
            ++this.state.pos;
          }
        case 10:
        case 8232:
        case 8233:
          ++this.state.pos;
          ++this.state.curLine;
          this.state.lineStart = this.state.pos;
          break;
        case 47:
          switch (this.input.charCodeAt(this.state.pos + 1)) {
            case 42: {
              const comment = this.skipBlockComment("*/");
              if (comment !== void 0) {
                this.addComment(comment);
                comments?.push(comment);
              }
              break;
            }
            case 47: {
              const comment = this.skipLineComment(2);
              if (comment !== void 0) {
                this.addComment(comment);
                comments?.push(comment);
              }
              break;
            }
            default:
              break loop;
          }
          break;
        default:
          if (isWhitespace(ch)) {
            ++this.state.pos;
          } else if (ch === 45 && !this.inModule && this.optionFlags & 16384) {
            const pos = this.state.pos;
            if (this.input.charCodeAt(pos + 1) === 45 && this.input.charCodeAt(pos + 2) === 62 && (spaceStart === 0 || this.state.lineStart > spaceStart)) {
              const comment = this.skipLineComment(3);
              if (comment !== void 0) {
                this.addComment(comment);
                comments?.push(comment);
              }
            } else {
              break loop;
            }
          } else if (ch === 60 && !this.inModule && this.optionFlags & 16384) {
            const pos = this.state.pos;
            if (this.input.charCodeAt(pos + 1) === 33 && this.input.charCodeAt(pos + 2) === 45 && this.input.charCodeAt(pos + 3) === 45) {
              const comment = this.skipLineComment(4);
              if (comment !== void 0) {
                this.addComment(comment);
                comments?.push(comment);
              }
            } else {
              break loop;
            }
          } else {
            break loop;
          }
      }
    }
    if (comments?.length > 0) {
      const end = this.state.pos;
      const commentWhitespace = {
        start: this.sourceToOffsetPos(spaceStart),
        end: this.sourceToOffsetPos(end),
        comments,
        leadingNode: null,
        trailingNode: null,
        containingNode: null
      };
      this.state.commentStack.push(commentWhitespace);
    }
  }
  finishToken(type, val) {
    this.state.end = this.state.pos;
    this.state.endLoc = this.state.curPosition();
    const prevType = this.state.type;
    this.state.type = type;
    this.state.value = val;
    if (!this.isLookahead) {
      this.updateContext(prevType);
    }
  }
  replaceToken(type) {
    this.state.type = type;
    this.updateContext();
  }
  readToken_numberSign() {
    if (this.state.pos === 0 && this.readToken_interpreter()) {
      return;
    }
    const nextPos = this.state.pos + 1;
    const next = this.codePointAtPos(nextPos);
    if (next >= 48 && next <= 57) {
      throw this.raise(Errors.UnexpectedDigitAfterHash, this.state.curPosition());
    }
    if (isIdentifierStart(next)) {
      ++this.state.pos;
      this.finishToken(134, this.readWord1(next));
    } else if (next === 92) {
      ++this.state.pos;
      this.finishToken(134, this.readWord1());
    } else {
      this.finishOp(23, 1);
    }
  }
  readToken_dot() {
    const next = this.input.charCodeAt(this.state.pos + 1);
    if (next >= 48 && next <= 57) {
      this.readNumber(true);
      return;
    }
    if (next === 46 && this.input.charCodeAt(this.state.pos + 2) === 46) {
      this.state.pos += 3;
      this.finishToken(17);
    } else {
      ++this.state.pos;
      this.finishToken(12);
    }
  }
  readToken_slash() {
    const next = this.input.charCodeAt(this.state.pos + 1);
    if (next === 61) {
      this.finishOp(27, 2);
    } else {
      this.finishOp(52, 1);
    }
  }
  readToken_interpreter() {
    if (this.state.pos !== 0 || this.length < 2) return false;
    let ch = this.input.charCodeAt(this.state.pos + 1);
    if (ch !== 33) return false;
    const start = this.state.pos;
    this.state.pos += 1;
    while (!isNewLine(ch) && ++this.state.pos < this.length) {
      ch = this.input.charCodeAt(this.state.pos);
    }
    const value = this.input.slice(start + 2, this.state.pos);
    this.finishToken(24, value);
    return true;
  }
  readToken_mult_modulo(code2) {
    let type = code2 === 42 ? 51 : 50;
    let width = 1;
    let next = this.input.charCodeAt(this.state.pos + 1);
    if (code2 === 42 && next === 42) {
      width++;
      next = this.input.charCodeAt(this.state.pos + 2);
      type = 53;
    }
    if (next === 61 && !this.state.inType) {
      width++;
      type = code2 === 37 ? 29 : 26;
    }
    this.finishOp(type, width);
  }
  readToken_pipe_amp(code2) {
    const next = this.input.charCodeAt(this.state.pos + 1);
    if (next === code2) {
      if (this.input.charCodeAt(this.state.pos + 2) === 61) {
        this.finishOp(26, 3);
      } else {
        this.finishOp(code2 === 124 ? 37 : 38, 2);
      }
      return;
    }
    if (code2 === 124) {
      if (next === 62) {
        this.finishOp(35, 2);
        return;
      }
    }
    if (next === 61) {
      this.finishOp(26, 2);
      return;
    }
    this.finishOp(code2 === 124 ? 39 : 41, 1);
  }
  readToken_caret() {
    const next = this.input.charCodeAt(this.state.pos + 1);
    if (next === 61 && !this.state.inType) {
      this.finishOp(28, 2);
    } else if (next === 94 && this.hasPlugin(["pipelineOperator", {
      proposal: "hack",
      topicToken: "^^"
    }])) {
      this.finishOp(33, 2);
      const lookaheadCh = this.input.codePointAt(this.state.pos);
      if (lookaheadCh === 94) {
        this.unexpected();
      }
    } else {
      this.finishOp(40, 1);
    }
  }
  readToken_atSign() {
    const next = this.input.charCodeAt(this.state.pos + 1);
    if (next === 64 && this.hasPlugin(["pipelineOperator", {
      proposal: "hack",
      topicToken: "@@"
    }])) {
      this.finishOp(34, 2);
    } else {
      this.finishOp(22, 1);
    }
  }
  readToken_plus_min(code2) {
    const next = this.input.charCodeAt(this.state.pos + 1);
    if (next === code2) {
      this.finishOp(30, 2);
      return;
    }
    if (next === 61) {
      this.finishOp(26, 2);
    } else {
      this.finishOp(49, 1);
    }
  }
  readToken_lt() {
    const {
      pos
    } = this.state;
    const next = this.input.charCodeAt(pos + 1);
    if (next === 60) {
      if (this.input.charCodeAt(pos + 2) === 61) {
        this.finishOp(26, 3);
        return;
      }
      this.finishOp(47, 2);
      return;
    }
    if (next === 61) {
      this.finishOp(45, 2);
      return;
    }
    this.finishOp(43, 1);
  }
  readToken_gt() {
    const {
      pos
    } = this.state;
    const next = this.input.charCodeAt(pos + 1);
    if (next === 62) {
      const size = this.input.charCodeAt(pos + 2) === 62 ? 3 : 2;
      if (this.input.charCodeAt(pos + size) === 61) {
        this.finishOp(26, size + 1);
        return;
      }
      this.finishOp(48, size);
      return;
    }
    if (next === 61) {
      this.finishOp(45, 2);
      return;
    }
    this.finishOp(44, 1);
  }
  readToken_eq_excl(code2) {
    const next = this.input.charCodeAt(this.state.pos + 1);
    if (next === 61) {
      this.finishOp(42, this.input.charCodeAt(this.state.pos + 2) === 61 ? 3 : 2);
      return;
    }
    if (code2 === 61 && next === 62) {
      this.state.pos += 2;
      this.finishToken(15);
      return;
    }
    this.finishOp(code2 === 61 ? 25 : 31, 1);
  }
  readToken_question() {
    const next = this.input.charCodeAt(this.state.pos + 1);
    const next2 = this.input.charCodeAt(this.state.pos + 2);
    if (next === 63) {
      if (next2 === 61) {
        this.finishOp(26, 3);
      } else {
        this.finishOp(36, 2);
      }
    } else if (next === 46 && !(next2 >= 48 && next2 <= 57)) {
      this.state.pos += 2;
      this.finishToken(14);
    } else {
      ++this.state.pos;
      this.finishToken(13);
    }
  }
  getTokenFromCode(code2) {
    switch (code2) {
      case 46:
        this.readToken_dot();
        return;
      case 40:
        ++this.state.pos;
        this.finishToken(6);
        return;
      case 41:
        ++this.state.pos;
        this.finishToken(7);
        return;
      case 59:
        ++this.state.pos;
        this.finishToken(9);
        return;
      case 44:
        ++this.state.pos;
        this.finishToken(8);
        return;
      case 91:
        ++this.state.pos;
        this.finishToken(0);
        return;
      case 93:
        ++this.state.pos;
        this.finishToken(1);
        return;
      case 123:
        ++this.state.pos;
        this.finishToken(2);
        return;
      case 125:
        ++this.state.pos;
        this.finishToken(4);
        return;
      case 58:
        if (this.hasPlugin("functionBind") && this.input.charCodeAt(this.state.pos + 1) === 58) {
          this.finishOp(11, 2);
        } else {
          ++this.state.pos;
          this.finishToken(10);
        }
        return;
      case 63:
        this.readToken_question();
        return;
      case 96:
        this.readTemplateToken();
        return;
      case 48: {
        const next = this.input.charCodeAt(this.state.pos + 1);
        if (next === 120 || next === 88) {
          this.readRadixNumber(16);
          return;
        }
        if (next === 111 || next === 79) {
          this.readRadixNumber(8);
          return;
        }
        if (next === 98 || next === 66) {
          this.readRadixNumber(2);
          return;
        }
      }
      case 49:
      case 50:
      case 51:
      case 52:
      case 53:
      case 54:
      case 55:
      case 56:
      case 57:
        this.readNumber(false);
        return;
      case 34:
      case 39:
        this.readString(code2);
        return;
      case 47:
        this.readToken_slash();
        return;
      case 37:
      case 42:
        this.readToken_mult_modulo(code2);
        return;
      case 124:
      case 38:
        this.readToken_pipe_amp(code2);
        return;
      case 94:
        this.readToken_caret();
        return;
      case 43:
      case 45:
        this.readToken_plus_min(code2);
        return;
      case 60:
        this.readToken_lt();
        return;
      case 62:
        this.readToken_gt();
        return;
      case 61:
      case 33:
        this.readToken_eq_excl(code2);
        return;
      case 126:
        this.finishOp(32, 1);
        return;
      case 64:
        this.readToken_atSign();
        return;
      case 35:
        this.readToken_numberSign();
        return;
      case 92:
        this.readWord();
        return;
      default:
        if (isIdentifierStart(code2)) {
          this.readWord(code2);
          return;
        }
    }
    throw this.raise(Errors.InvalidOrUnexpectedToken, this.state.curPosition(), {
      unexpected: String.fromCodePoint(code2)
    });
  }
  finishOp(type, size) {
    const str = this.input.slice(this.state.pos, this.state.pos + size);
    this.state.pos += size;
    this.finishToken(type, str);
  }
  readRegexp() {
    const startLoc = this.state.startLoc;
    const start = this.state.start + 1;
    let escaped, inClass;
    let {
      pos
    } = this.state;
    for (; ; ++pos) {
      if (pos >= this.length) {
        throw this.raise(Errors.UnterminatedRegExp, createPositionWithColumnOffset(startLoc, 1));
      }
      const ch = this.input.charCodeAt(pos);
      if (isNewLine(ch)) {
        throw this.raise(Errors.UnterminatedRegExp, createPositionWithColumnOffset(startLoc, 1));
      }
      if (escaped) {
        escaped = false;
      } else {
        if (ch === 91) {
          inClass = true;
        } else if (ch === 93 && inClass) {
          inClass = false;
        } else if (ch === 47 && !inClass) {
          break;
        }
        escaped = ch === 92;
      }
    }
    const content = this.input.slice(start, pos);
    ++pos;
    let mods = "";
    const nextPos = () => createPositionWithColumnOffset(startLoc, pos + 2 - start);
    while (pos < this.length) {
      const cp = this.codePointAtPos(pos);
      const char = String.fromCharCode(cp);
      if (VALID_REGEX_FLAGS.has(cp)) {
        if (cp === 118) {
          if (mods.includes("u")) {
            this.raise(Errors.IncompatibleRegExpUVFlags, nextPos());
          }
        } else if (cp === 117) {
          if (mods.includes("v")) {
            this.raise(Errors.IncompatibleRegExpUVFlags, nextPos());
          }
        }
        if (mods.includes(char)) {
          this.raise(Errors.DuplicateRegExpFlags, nextPos());
        }
      } else if (isIdentifierChar(cp) || cp === 92) {
        this.raise(Errors.MalformedRegExpFlags, nextPos());
      } else {
        break;
      }
      ++pos;
      mods += char;
    }
    this.state.pos = pos;
    this.finishToken(133, {
      pattern: content,
      flags: mods
    });
  }
  readInt(radix, len, forceLen = false, allowNumSeparator = true) {
    const {
      n,
      pos
    } = readInt(this.input, this.state.pos, this.state.lineStart, this.state.curLine, radix, len, forceLen, allowNumSeparator, this.errorHandlers_readInt, false);
    this.state.pos = pos;
    return n;
  }
  readRadixNumber(radix) {
    const start = this.state.pos;
    const startLoc = this.state.curPosition();
    let isBigInt = false;
    this.state.pos += 2;
    const val = this.readInt(radix);
    if (val == null) {
      this.raise(Errors.InvalidDigit, createPositionWithColumnOffset(startLoc, 2), {
        radix
      });
    }
    const next = this.input.charCodeAt(this.state.pos);
    if (next === 110) {
      ++this.state.pos;
      isBigInt = true;
    }
    if (isIdentifierStart(this.codePointAtPos(this.state.pos))) {
      throw this.raise(Errors.NumberIdentifier, this.state.curPosition());
    }
    if (isBigInt) {
      const str = this.input.slice(start, this.state.pos).replace(/[_n]/g, "");
      this.finishToken(132, str);
      return;
    }
    this.finishToken(131, val);
  }
  readNumber(startsWithDot) {
    const start = this.state.pos;
    const startLoc = this.state.curPosition();
    let isFloat = false;
    let isBigInt = false;
    let isOctal = false;
    if (!startsWithDot && this.readInt(10) === null) {
      this.raise(Errors.InvalidNumber, this.state.curPosition());
    }
    const hasLeadingZero = this.state.pos - start >= 2 && this.input.charCodeAt(start) === 48;
    if (hasLeadingZero) {
      const integer = this.input.slice(start, this.state.pos);
      this.recordStrictModeErrors(Errors.StrictOctalLiteral, startLoc);
      if (!this.state.strict) {
        const underscorePos = integer.indexOf("_");
        if (underscorePos > 0) {
          this.raise(Errors.ZeroDigitNumericSeparator, createPositionWithColumnOffset(startLoc, underscorePos));
        }
      }
      isOctal = hasLeadingZero && !/[89]/.test(integer);
    }
    let next = this.input.charCodeAt(this.state.pos);
    if (next === 46 && !isOctal) {
      ++this.state.pos;
      this.readInt(10);
      isFloat = true;
      next = this.input.charCodeAt(this.state.pos);
    }
    if ((next === 69 || next === 101) && !isOctal) {
      next = this.input.charCodeAt(++this.state.pos);
      if (next === 43 || next === 45) {
        ++this.state.pos;
      }
      if (this.readInt(10) === null) {
        this.raise(Errors.InvalidOrMissingExponent, startLoc);
      }
      isFloat = true;
      next = this.input.charCodeAt(this.state.pos);
    }
    const str = this.input.slice(start, this.state.pos).replaceAll("_", "");
    if (next === 110) {
      if (isFloat || hasLeadingZero) {
        this.raise(Errors.InvalidBigIntLiteral, startLoc);
      }
      ++this.state.pos;
      isBigInt = true;
    }
    if (isIdentifierStart(this.codePointAtPos(this.state.pos))) {
      throw this.raise(Errors.NumberIdentifier, this.state.curPosition());
    }
    if (isBigInt) {
      this.finishToken(132, str);
      return;
    }
    const val = isOctal ? parseInt(str, 8) : parseFloat(str);
    this.finishToken(131, val);
  }
  readCodePoint(throwOnInvalid) {
    const {
      code: code2,
      pos
    } = readCodePoint(this.input, this.state.pos, this.state.lineStart, this.state.curLine, throwOnInvalid, this.errorHandlers_readCodePoint);
    this.state.pos = pos;
    return code2;
  }
  readString(quote) {
    const {
      str,
      pos,
      curLine,
      lineStart
    } = readStringContents(quote === 34 ? "double" : "single", this.input, this.state.pos + 1, this.state.lineStart, this.state.curLine, this.errorHandlers_readStringContents_string);
    this.state.pos = pos + 1;
    this.state.lineStart = lineStart;
    this.state.curLine = curLine;
    this.finishToken(130, str);
  }
  readTemplateContinuation() {
    if (!this.match(4)) {
      this.unexpected(null, 4);
    }
    this.state.pos--;
    this.readTemplateToken();
  }
  readTemplateToken() {
    const opening = this.input[this.state.pos];
    const {
      str,
      firstInvalidLoc,
      pos,
      curLine,
      lineStart
    } = readStringContents("template", this.input, this.state.pos + 1, this.state.lineStart, this.state.curLine, this.errorHandlers_readStringContents_template);
    this.state.pos = pos + 1;
    this.state.lineStart = lineStart;
    this.state.curLine = curLine;
    if (firstInvalidLoc) {
      this.state.firstInvalidTemplateEscapePos = new Position(firstInvalidLoc.curLine, firstInvalidLoc.pos - firstInvalidLoc.lineStart, this.sourceToOffsetPos(firstInvalidLoc.pos));
    }
    if (this.input.codePointAt(pos) === 96) {
      this.finishToken(20, firstInvalidLoc ? null : opening + str + "`");
    } else {
      this.state.pos++;
      this.finishToken(21, firstInvalidLoc ? null : opening + str + "${");
    }
  }
  recordStrictModeErrors(toParseError, at) {
    const index = at.index;
    if (this.state.strict && !this.state.strictErrors.has(index)) {
      this.raise(toParseError, at);
    } else {
      this.state.strictErrors.set(index, [toParseError, at]);
    }
  }
  readWord1(firstCode) {
    this.state.containsEsc = false;
    let word = "";
    const start = this.state.pos;
    let chunkStart = this.state.pos;
    if (firstCode !== void 0) {
      this.state.pos += firstCode <= 65535 ? 1 : 2;
    }
    while (this.state.pos < this.length) {
      const ch = this.codePointAtPos(this.state.pos);
      if (isIdentifierChar(ch)) {
        this.state.pos += ch <= 65535 ? 1 : 2;
      } else if (ch === 92) {
        this.state.containsEsc = true;
        word += this.input.slice(chunkStart, this.state.pos);
        const escStart = this.state.curPosition();
        const identifierCheck = this.state.pos === start ? isIdentifierStart : isIdentifierChar;
        if (this.input.charCodeAt(++this.state.pos) !== 117) {
          this.raise(Errors.MissingUnicodeEscape, this.state.curPosition());
          chunkStart = this.state.pos - 1;
          continue;
        }
        ++this.state.pos;
        const esc = this.readCodePoint(true);
        if (esc !== null) {
          if (!identifierCheck(esc)) {
            this.raise(Errors.EscapedCharNotAnIdentifier, escStart);
          }
          word += String.fromCodePoint(esc);
        }
        chunkStart = this.state.pos;
      } else {
        break;
      }
    }
    return word + this.input.slice(chunkStart, this.state.pos);
  }
  readWord(firstCode) {
    const word = this.readWord1(firstCode);
    const type = keywords$1.get(word);
    if (type !== void 0) {
      this.finishToken(type, tokenLabelName(type));
    } else {
      this.finishToken(128, word);
    }
  }
  checkKeywordEscapes() {
    const {
      type
    } = this.state;
    if (tokenIsKeyword(type) && this.state.containsEsc) {
      this.raise(Errors.InvalidEscapedReservedWord, this.state.startLoc, {
        reservedWord: tokenLabelName(type)
      });
    }
  }
  raise(toParseError, at, details = {}) {
    const loc = at instanceof Position ? at : typeof at === "number" ? this.getLoc(at) : this.optionFlags & 256 ? at.loc.start : this.getLoc(at.start);
    const pos = at instanceof Position ? loc.index : typeof at === "number" ? at : at.start;
    const error = toParseError(loc, pos, details);
    if (!(this.optionFlags & 4096)) throw error;
    if (!this.isLookahead) this.state.errors.push(error);
    return error;
  }
  raiseOverwrite(toParseError, at, details = {}) {
    const loc = at instanceof Position ? at : this.optionFlags & 256 ? at.loc.start : this.getLoc(at.start);
    const pos = at instanceof Position ? loc.index : at.start;
    const errors = this.state.errors;
    for (let i = errors.length - 1; i >= 0; i--) {
      const error = errors[i];
      if (error.pos === pos) {
        return errors[i] = toParseError(loc, pos, details);
      }
      if (error.pos < pos) break;
    }
    return this.raise(toParseError, loc, details);
  }
  updateContext(prevType) {
  }
  unexpected(loc, type) {
    throw this.raise(Errors.UnexpectedToken, loc != null ? loc : this.state.startLoc, {
      expected: type ? tokenLabelName(type) : null
    });
  }
  expectPlugin(pluginName, loc) {
    if (this.hasPlugin(pluginName)) {
      return true;
    }
    throw this.raise(Errors.MissingPlugin, loc != null ? loc : this.state.startLoc, {
      missingPlugin: [pluginName]
    });
  }
  expectOnePlugin(pluginNames) {
    if (!pluginNames.some((name) => this.hasPlugin(name))) {
      throw this.raise(Errors.MissingOneOfPlugins, this.state.startLoc, {
        missingPlugin: pluginNames
      });
    }
  }
  errorBuilder(error) {
    return (pos, lineStart, curLine) => {
      this.raise(error, buildPosition(pos, lineStart, curLine));
    };
  }
  errorHandlers_readInt = {
    invalidDigit: (pos, lineStart, curLine, radix) => {
      if (!(this.optionFlags & 4096)) return false;
      this.raise(Errors.InvalidDigit, buildPosition(pos, lineStart, curLine), {
        radix
      });
      return true;
    },
    numericSeparatorInEscapeSequence: this.errorBuilder(Errors.NumericSeparatorInEscapeSequence),
    unexpectedNumericSeparator: this.errorBuilder(Errors.UnexpectedNumericSeparator)
  };
  errorHandlers_readCodePoint = {
    ...this.errorHandlers_readInt,
    invalidEscapeSequence: this.errorBuilder(Errors.InvalidEscapeSequence),
    invalidCodePoint: this.errorBuilder(Errors.InvalidCodePoint)
  };
  errorHandlers_readStringContents_string = {
    ...this.errorHandlers_readCodePoint,
    strictNumericEscape: (pos, lineStart, curLine) => {
      this.recordStrictModeErrors(Errors.StrictNumericEscape, buildPosition(pos, lineStart, curLine));
    },
    unterminated: (pos, lineStart, curLine) => {
      throw this.raise(Errors.UnterminatedString, buildPosition(pos - 1, lineStart, curLine));
    }
  };
  errorHandlers_readStringContents_template = {
    ...this.errorHandlers_readCodePoint,
    strictNumericEscape: this.errorBuilder(Errors.StrictNumericEscape),
    unterminated: (pos, lineStart, curLine) => {
      throw this.raise(Errors.UnterminatedTemplate, buildPosition(pos, lineStart, curLine));
    }
  };
};
var ClassScope = class {
  privateNames = /* @__PURE__ */ new Set();
  loneAccessors = /* @__PURE__ */ new Map();
  undefinedPrivateNames = /* @__PURE__ */ new Map();
};
var ClassScopeHandler = class {
  parser;
  stack = [];
  constructor(parser) {
    this.parser = parser;
  }
  current() {
    return this.stack[this.stack.length - 1];
  }
  enter() {
    this.stack.push(new ClassScope());
  }
  exit() {
    const oldClassScope = this.stack.pop();
    const current = this.current();
    for (const [name, loc] of Array.from(oldClassScope.undefinedPrivateNames)) {
      if (current) {
        if (!current.undefinedPrivateNames.has(name)) {
          current.undefinedPrivateNames.set(name, loc);
        }
      } else {
        this.parser.raise(Errors.InvalidPrivateFieldResolution, loc, {
          identifierName: name
        });
      }
    }
  }
  declarePrivateName(name, elementType, loc) {
    const {
      privateNames,
      loneAccessors,
      undefinedPrivateNames
    } = this.current();
    let redefined = privateNames.has(name);
    if (elementType & 3) {
      const accessor = redefined && loneAccessors.get(name);
      if (accessor) {
        const oldStatic = accessor & 4;
        const newStatic = elementType & 4;
        const oldKind = accessor & 3;
        const newKind = elementType & 3;
        redefined = oldKind === newKind || oldStatic !== newStatic;
        if (!redefined) loneAccessors.delete(name);
      } else if (!redefined) {
        loneAccessors.set(name, elementType);
      }
    }
    if (redefined) {
      this.parser.raise(Errors.PrivateNameRedeclaration, loc, {
        identifierName: name
      });
    }
    privateNames.add(name);
    undefinedPrivateNames.delete(name);
  }
  usePrivateName(name, loc) {
    let classScope;
    for (classScope of this.stack) {
      if (classScope.privateNames.has(name)) return;
    }
    if (classScope) {
      classScope.undefinedPrivateNames.set(name, loc);
    } else {
      this.parser.raise(Errors.InvalidPrivateFieldResolution, loc, {
        identifierName: name
      });
    }
  }
};
var ExpressionScope = class {
  constructor(type = 0) {
    this.type = type;
  }
  canBeArrowParameterDeclaration() {
    return this.type === 2 || this.type === 1;
  }
  isCertainlyParameterDeclaration() {
    return this.type === 3;
  }
};
var ArrowHeadParsingScope = class extends ExpressionScope {
  declarationErrors = /* @__PURE__ */ new Map();
  constructor(type) {
    super(type);
  }
  recordDeclarationError(ParsingErrorClass, index) {
    this.declarationErrors.set(index, ParsingErrorClass);
  }
  clearDeclarationError(index) {
    this.declarationErrors.delete(index);
  }
  iterateErrors(iterator) {
    this.declarationErrors.forEach(iterator);
  }
};
var ExpressionScopeHandler = class {
  parser;
  stack = [new ExpressionScope()];
  constructor(parser) {
    this.parser = parser;
  }
  enter(scope) {
    this.stack.push(scope);
  }
  exit() {
    this.stack.pop();
  }
  recordParameterInitializerError(toParseError, loc) {
    const {
      stack
    } = this;
    let i = stack.length - 1;
    let scope = stack[i];
    while (!scope.isCertainlyParameterDeclaration()) {
      if (scope.canBeArrowParameterDeclaration()) {
        scope.recordDeclarationError(toParseError, loc);
      } else {
        return;
      }
      scope = stack[--i];
    }
    this.parser.raise(toParseError, loc);
  }
  recordArrowParameterBindingError(error, node) {
    const {
      stack
    } = this;
    const scope = stack[stack.length - 1];
    const origin = node.start;
    if (scope.isCertainlyParameterDeclaration()) {
      this.parser.raise(error, origin);
    } else if (scope.canBeArrowParameterDeclaration()) {
      scope.recordDeclarationError(error, origin);
    } else {
      return;
    }
  }
  recordAsyncArrowParametersError(at) {
    const {
      stack
    } = this;
    let i = stack.length - 1;
    let scope = stack[i];
    while (scope.canBeArrowParameterDeclaration()) {
      if (scope.type === 2) {
        scope.recordDeclarationError(Errors.AwaitBindingIdentifier, at);
      }
      scope = stack[--i];
    }
  }
  validateAsPattern() {
    const {
      stack
    } = this;
    const currentScope = stack[stack.length - 1];
    if (!currentScope.canBeArrowParameterDeclaration()) return;
    currentScope.iterateErrors((toParseError, key) => {
      this.parser.raise(toParseError, key);
      let i = stack.length - 2;
      let scope = stack[i];
      while (scope.canBeArrowParameterDeclaration()) {
        scope.clearDeclarationError(key);
        scope = stack[--i];
      }
    });
  }
};
function newParameterDeclarationScope() {
  return new ExpressionScope(3);
}
function newArrowHeadScope() {
  return new ArrowHeadParsingScope(1);
}
function newAsyncArrowScope() {
  return new ArrowHeadParsingScope(2);
}
function newExpressionScope() {
  return new ExpressionScope();
}
var ProductionParameterHandler = class {
  stacks = [];
  enter(flags) {
    this.stacks.push(flags);
  }
  exit() {
    this.stacks.pop();
  }
  currentFlags() {
    return this.stacks[this.stacks.length - 1];
  }
  get hasAwait() {
    return (this.currentFlags() & 2) > 0;
  }
  get hasYield() {
    return (this.currentFlags() & 1) > 0;
  }
  get hasReturn() {
    return (this.currentFlags() & 4) > 0;
  }
  get hasIn() {
    return (this.currentFlags() & 8) > 0;
  }
  get inFSharpPipelineDirectBody() {
    return (this.currentFlags() & 16) === 0;
  }
};
function functionFlags(isAsync, isGenerator) {
  return (isAsync ? 2 : 0) | (isGenerator ? 1 : 0);
}
var UtilParser = class extends Tokenizer {
  addExtra(node, key, value, enumerable2 = true) {
    if (!node) return;
    let {
      extra
    } = node;
    if (extra == null) {
      extra = {};
      node.extra = extra;
    }
    if (enumerable2) {
      extra[key] = value;
    } else {
      Object.defineProperty(extra, key, {
        enumerable: enumerable2,
        value
      });
    }
  }
  isContextual(token) {
    return this.state.type === token && !this.state.containsEsc;
  }
  isUnparsedContextual(nameStart, name) {
    if (this.input.startsWith(name, nameStart)) {
      const nextCh = this.input.charCodeAt(nameStart + name.length);
      return !(isIdentifierChar(nextCh) || (nextCh & 64512) === 55296);
    }
    return false;
  }
  isLookaheadContextual(name) {
    const next = this.nextTokenStart();
    return this.isUnparsedContextual(next, name);
  }
  eatContextual(token) {
    if (this.isContextual(token)) {
      this.next();
      return true;
    }
    return false;
  }
  expectContextual(token, toParseError) {
    if (!this.eatContextual(token)) {
      if (toParseError != null) {
        throw this.raise(toParseError, this.state.startLoc);
      }
      this.unexpected(null, token);
    }
  }
  canInsertSemicolon() {
    return this.match(135) || this.match(4) || this.hasPrecedingLineBreak();
  }
  hasPrecedingLineBreak() {
    return hasNewLine(this.input, this.offsetToSourcePos(this.state.lastTokEndLoc.index), this.state.start);
  }
  hasFollowingLineBreak() {
    return hasNewLine(this.input, this.state.end, this.nextTokenStart());
  }
  isLineTerminator() {
    return this.eat(9) || this.canInsertSemicolon();
  }
  semicolon(allowAsi = true) {
    if (allowAsi ? this.isLineTerminator() : this.eat(9)) return;
    this.raise(Errors.MissingSemicolon, this.state.lastTokEndLoc);
  }
  expect(type, loc) {
    if (!this.eat(type)) {
      this.unexpected(loc, type);
    }
  }
  tryParse(fn, oldState = this.state.clone()) {
    const abortSignal = {
      node: null
    };
    try {
      const node = fn((node2 = null) => {
        abortSignal.node = node2;
        throw abortSignal;
      });
      if (this.state.errors.length > oldState.errors.length) {
        const failState = this.state;
        this.state = oldState;
        this.state.tokensLength = failState.tokensLength;
        return {
          node,
          error: failState.errors[oldState.errors.length],
          thrown: false,
          aborted: false,
          failState
        };
      }
      return {
        node,
        error: null,
        thrown: false,
        aborted: false,
        failState: null
      };
    } catch (error) {
      const failState = this.state;
      this.state = oldState;
      if (error instanceof SyntaxError) {
        return {
          node: null,
          error,
          thrown: true,
          aborted: false,
          failState
        };
      }
      if (error === abortSignal) {
        return {
          node: abortSignal.node,
          error: null,
          thrown: false,
          aborted: true,
          failState
        };
      }
      throw error;
    }
  }
  checkExpressionErrors(refExpressionErrors, andThrow) {
    if (!refExpressionErrors) return false;
    const {
      shorthandAssignLoc,
      doubleProtoLoc,
      privateKeyLoc,
      optionalParametersLoc,
      voidPatternLoc
    } = refExpressionErrors;
    const hasErrors = !!shorthandAssignLoc || !!doubleProtoLoc || !!optionalParametersLoc || !!privateKeyLoc || !!voidPatternLoc;
    if (!andThrow) {
      return hasErrors;
    }
    if (shorthandAssignLoc != null) {
      this.raise(Errors.InvalidCoverInitializedName, shorthandAssignLoc);
    }
    if (doubleProtoLoc != null) {
      this.raise(Errors.DuplicateProto, doubleProtoLoc);
    }
    if (privateKeyLoc != null) {
      this.raise(Errors.UnexpectedPrivateField, privateKeyLoc);
    }
    if (optionalParametersLoc != null) {
      this.unexpected(optionalParametersLoc);
    }
    if (voidPatternLoc != null) {
      this.raise(Errors.InvalidCoverDiscardElement, voidPatternLoc);
    }
  }
  isLiteralPropertyName() {
    return tokenIsLiteralPropertyName(this.state.type);
  }
  isPrivateName(node) {
    return node.type === "PrivateName";
  }
  getPrivateNameSV(node) {
    return node.id.name;
  }
  hasPropertyAsPrivateName(node) {
    return (node.type === "MemberExpression" || node.type === "OptionalMemberExpression") && this.isPrivateName(node.property);
  }
  isObjectProperty(node) {
    return node.type === "ObjectProperty";
  }
  isObjectMethod(node) {
    return node.type === "ObjectMethod";
  }
  initializeScopes(inModule = this.options.sourceType === "module") {
    const oldLabels = this.state.labels;
    this.state.labels = [];
    const oldExportedIdentifiers = this.exportedIdentifiers;
    this.exportedIdentifiers = /* @__PURE__ */ new Set();
    const oldInModule = this.inModule;
    this.inModule = inModule;
    const oldScope = this.scope;
    const ScopeHandler2 = this.getScopeHandler();
    this.scope = new ScopeHandler2(this, inModule);
    const oldProdParam = this.prodParam;
    this.prodParam = new ProductionParameterHandler();
    const oldClassScope = this.classScope;
    this.classScope = new ClassScopeHandler(this);
    const oldExpressionScope = this.expressionScope;
    this.expressionScope = new ExpressionScopeHandler(this);
    return () => {
      this.state.labels = oldLabels;
      this.exportedIdentifiers = oldExportedIdentifiers;
      this.inModule = oldInModule;
      this.scope = oldScope;
      this.prodParam = oldProdParam;
      this.classScope = oldClassScope;
      this.expressionScope = oldExpressionScope;
    };
  }
  enterInitialScopes() {
    let paramFlags = 0;
    if (this.inModule || this.optionFlags & 1) {
      paramFlags |= 2;
    }
    if (this.optionFlags & 32) {
      paramFlags |= 1;
    }
    const isCommonJS = !this.inModule && this.options.sourceType === "commonjs";
    if (isCommonJS || this.optionFlags & 2) {
      paramFlags |= 4;
    }
    this.prodParam.enter(paramFlags);
    let scopeFlags = isCommonJS ? 514 : 1;
    if (this.optionFlags & 4) {
      scopeFlags |= 512;
    }
    if (this.optionFlags & 16) {
      scopeFlags |= 16 | 32;
    }
    this.scope.enter(scopeFlags);
  }
  checkDestructuringPrivate(refExpressionErrors) {
    const {
      privateKeyLoc
    } = refExpressionErrors;
    if (privateKeyLoc !== null) {
      this.expectPlugin("destructuringPrivate", privateKeyLoc);
    }
  }
};
var ExpressionErrors = class {
  shorthandAssignLoc = null;
  doubleProtoLoc = null;
  privateKeyLoc = null;
  optionalParametersLoc = null;
  voidPatternLoc = null;
};
var Node = class {
  constructor(optionFlags, filename, pos, loc) {
    this.start = pos;
    this.end = 0;
    if (loc !== void 0) this.loc = new SourceLocation(loc);
    if (optionFlags & 128) this.range = [pos, 0];
    if (loc !== void 0 && filename) {
      this.loc.filename = filename;
    }
  }
  type = "";
};
var NodePrototype = Node.prototype;
var NodeUtils = class extends UtilParser {
  createPosition(loc) {
    return loc;
  }
  startNode() {
    const {
      startLoc
    } = this.state;
    this.setLoc(startLoc);
    return this.startNodeAt(startLoc);
  }
  startNodeAt(loc) {
    const {
      optionFlags,
      filename
    } = this;
    if (!(optionFlags & 256)) {
      return new Node(optionFlags, filename, loc.index);
    }
    return new Node(optionFlags, filename, loc.index, this.createPosition(loc));
  }
  startNodeAtNode(type) {
    const {
      optionFlags,
      filename
    } = this;
    if (!(optionFlags & 256)) {
      return new Node(optionFlags, filename, type.start);
    }
    return new Node(optionFlags, filename, type.start, type.loc.start);
  }
  finishNode(node, type) {
    return this.finishNodeAt(node, type, this.state.lastTokEndLoc);
  }
  finishNodeAt(node, type, endLoc) {
    node.type = type;
    node.end = endLoc.index;
    const {
      optionFlags
    } = this;
    if (optionFlags & 256) {
      node.loc.end = this.createPosition(endLoc);
    }
    if (optionFlags & 128) node.range[1] = endLoc.index;
    if (optionFlags & 8192) this.processComment(node);
    return node;
  }
  finishNodeAtNode(node, type, endNode) {
    node.type = type;
    node.end = endNode.end;
    const {
      optionFlags
    } = this;
    if (optionFlags & 256) {
      node.loc.end = endNode.loc.end;
    }
    if (optionFlags & 128) node.range[1] = node.end;
    if (optionFlags & 8192) this.processComment(node);
    return node;
  }
  resetStartLocation(node, startLoc) {
    node.start = startLoc.index;
    const {
      optionFlags
    } = this;
    if (optionFlags & 256) {
      node.loc.start = this.createPosition(startLoc);
    }
    if (optionFlags & 128) node.range[0] = startLoc.index;
  }
  resetEndLocation(node, endLoc = this.state.lastTokEndLoc) {
    node.end = endLoc.index;
    const {
      optionFlags
    } = this;
    if (optionFlags & 256) {
      node.loc.end = this.createPosition(endLoc);
    }
    if (optionFlags & 128) node.range[1] = endLoc.index;
  }
  resetStartLocationFromNode(node, locationNode) {
    node.start = locationNode.start;
    const {
      optionFlags
    } = this;
    if (optionFlags & 256) {
      node.loc.start = locationNode.loc.start;
    }
    if (optionFlags & 128) node.range[0] = locationNode.start;
  }
  resetEndLocationFromNode(node, locationNode) {
    node.end = locationNode.end;
    const {
      optionFlags
    } = this;
    if (optionFlags & 256) {
      node.loc.end = locationNode.loc.end;
    }
    if (optionFlags & 128) node.range[1] = locationNode.end;
  }
  castNodeTo(node, type) {
    node.type = type;
    return node;
  }
  cloneIdentifier(node) {
    const {
      type,
      start,
      end,
      loc,
      range,
      name
    } = node;
    const cloned = Object.create(NodePrototype);
    cloned.type = type;
    cloned.start = start;
    cloned.end = end;
    cloned.loc = loc;
    cloned.range = range;
    cloned.name = name;
    if (node.extra) cloned.extra = node.extra;
    return cloned;
  }
  cloneStringLiteral(node) {
    const {
      type,
      start,
      end,
      loc,
      range,
      extra
    } = node;
    const cloned = Object.create(NodePrototype);
    cloned.type = type;
    cloned.start = start;
    cloned.end = end;
    cloned.loc = loc;
    cloned.range = range;
    cloned.extra = extra;
    cloned.value = node.value;
    return cloned;
  }
};
var unwrapParenthesizedExpression = (node) => {
  return node.type === "ParenthesizedExpression" ? unwrapParenthesizedExpression(node.expression) : node;
};
var LValParser = class extends NodeUtils {
  toAssignable(node, isLHS = false) {
    let parenthesized = void 0;
    if (node.type === "ParenthesizedExpression" || node.extra?.parenthesized) {
      parenthesized = unwrapParenthesizedExpression(node);
      if (isLHS) {
        if (parenthesized.type === "Identifier") {
          this.expressionScope.recordArrowParameterBindingError(Errors.InvalidParenthesizedAssignment, node);
        } else if (parenthesized.type !== "CallExpression" && parenthesized.type !== "MemberExpression" && !this.isOptionalMemberExpression(parenthesized)) {
          this.raise(Errors.InvalidParenthesizedAssignment, node);
        }
      } else {
        this.raise(Errors.InvalidParenthesizedAssignment, node);
      }
    }
    switch (node.type) {
      case "Identifier":
      case "ObjectPattern":
      case "ArrayPattern":
      case "AssignmentPattern":
      case "RestElement":
      case "VoidPattern":
        break;
      case "ObjectExpression":
        this.castNodeTo(node, "ObjectPattern");
        for (let i = 0, length = node.properties.length, last = length - 1; i < length; i++) {
          const prop = node.properties[i];
          const isLast = i === last;
          this.toAssignableObjectExpressionProp(prop, isLast, isLHS);
          if (isLast && prop.type === "RestElement" && node.extra?.trailingCommaLoc) {
            this.raise(Errors.RestTrailingComma, node.extra.trailingCommaLoc);
          }
        }
        break;
      case "ObjectProperty": {
        const {
          key,
          value
        } = node;
        if (this.isPrivateName(key)) {
          this.classScope.usePrivateName(this.getPrivateNameSV(key), key.start);
        }
        this.toAssignable(value, isLHS);
        break;
      }
      case "SpreadElement": {
        throw new Error("Internal @babel/parser error (this is a bug, please report it). SpreadElement should be converted by .toAssignable's caller.");
      }
      case "ArrayExpression":
        this.castNodeTo(node, "ArrayPattern");
        this.toAssignableList(node.elements, node.extra?.trailingCommaLoc, isLHS);
        break;
      case "AssignmentExpression":
        if (node.operator !== "=") {
          this.raise(Errors.MissingEqInAssignment, this.optionFlags & 256 ? node.left.loc.end : node.left);
        }
        this.castNodeTo(node, "AssignmentPattern");
        delete node.operator;
        if (node.left.type === "VoidPattern") {
          this.raise(Errors.VoidPatternInitializer, node.left);
        }
        this.toAssignable(node.left, isLHS);
        break;
      case "ParenthesizedExpression":
        this.toAssignable(parenthesized, isLHS);
        break;
    }
  }
  toAssignableObjectExpressionProp(prop, isLast, isLHS) {
    if (prop.type === "ObjectMethod") {
      this.raise(prop.kind === "get" || prop.kind === "set" ? Errors.PatternHasAccessor : Errors.PatternHasMethod, prop.key);
    } else if (prop.type === "SpreadElement") {
      this.castNodeTo(prop, "RestElement");
      const arg = prop.argument;
      this.checkToRestConversion(arg, false);
      this.toAssignable(arg, isLHS);
      if (!isLast) {
        this.raise(Errors.RestTrailingComma, prop);
      }
    } else {
      this.toAssignable(prop, isLHS);
    }
  }
  toAssignableList(exprList, trailingCommaLoc, isLHS) {
    const end = exprList.length - 1;
    for (let i = 0; i <= end; i++) {
      const elt = exprList[i];
      if (!elt) continue;
      this.toAssignableListItem(exprList, i, isLHS);
      if (elt.type === "RestElement") {
        if (i < end) {
          this.raise(Errors.RestTrailingComma, elt);
        } else if (trailingCommaLoc) {
          this.raise(Errors.RestTrailingComma, trailingCommaLoc);
        }
      }
    }
  }
  toAssignableListItem(exprList, index, isLHS) {
    const node = exprList[index];
    if (node.type === "SpreadElement") {
      this.castNodeTo(node, "RestElement");
      const arg = node.argument;
      this.checkToRestConversion(arg, true);
      this.toAssignable(arg, isLHS);
    } else {
      this.toAssignable(node, isLHS);
    }
  }
  isAssignable(node, isBinding) {
    switch (node.type) {
      case "Identifier":
      case "ObjectPattern":
      case "ArrayPattern":
      case "AssignmentPattern":
      case "RestElement":
      case "VoidPattern":
        return true;
      case "ObjectExpression": {
        const last = node.properties.length - 1;
        return node.properties.every((prop, i) => {
          return prop.type !== "ObjectMethod" && (i === last || prop.type !== "SpreadElement") && this.isAssignable(prop);
        });
      }
      case "ObjectProperty":
        return this.isAssignable(node.value);
      case "SpreadElement":
        return this.isAssignable(node.argument);
      case "ArrayExpression":
        return node.elements.every((element) => element === null || this.isAssignable(element));
      case "AssignmentExpression":
        return node.operator === "=";
      case "ParenthesizedExpression":
        return this.isAssignable(node.expression);
      case "MemberExpression":
      case "OptionalMemberExpression":
        return !isBinding;
      default:
        return false;
    }
  }
  toReferencedList(exprList, isParenthesizedExpr) {
    return exprList;
  }
  parseSpread(refExpressionErrors) {
    const node = this.startNode();
    this.next();
    node.argument = this.parseMaybeAssignAllowIn(refExpressionErrors, void 0);
    return this.finishNode(node, "SpreadElement");
  }
  parseRestBinding() {
    const node = this.startNode();
    this.next();
    const argument = this.parseBindingAtom();
    if (argument.type === "VoidPattern") {
      this.raise(Errors.UnexpectedVoidPattern, argument);
    }
    node.argument = argument;
    return this.finishNode(node, "RestElement");
  }
  parseBindingAtom() {
    switch (this.state.type) {
      case 0: {
        const node = this.startNode();
        this.next();
        node.elements = this.parseBindingList(1, 93, 1);
        return this.finishNode(node, "ArrayPattern");
      }
      case 2:
        return this.parseObjectLike(4, true);
      case 84:
        return this.parseVoidPattern(null);
    }
    return this.parseIdentifier();
  }
  parseBindingList(close, closeCharCode, flags) {
    const allowEmpty = flags & 1;
    const elts = [];
    let first = true;
    while (!this.eat(close)) {
      if (first) {
        first = false;
      } else {
        this.expect(8);
      }
      if (allowEmpty && this.match(8)) {
        elts.push(null);
      } else if (this.eat(close)) {
        break;
      } else if (this.match(17)) {
        let rest = this.parseRestBinding();
        if (flags & 2) {
          rest = this.parseFunctionParamType(rest);
        }
        elts.push(rest);
        if (!this.checkCommaAfterRest(closeCharCode)) {
          this.expect(close);
          break;
        }
      } else {
        const decorators = [];
        if (flags & 2) {
          if (this.match(22) && this.hasPlugin("decorators")) {
            this.raise(Errors.UnsupportedParameterDecorator, this.state.startLoc);
          }
          while (this.match(22)) {
            decorators.push(this.parseDecorator());
          }
        }
        elts.push(this.parseBindingElement(flags, decorators));
      }
    }
    return elts;
  }
  parseBindingRestProperty(prop) {
    this.next();
    if (this.hasPlugin("discardBinding") && this.match(84)) {
      prop.argument = this.parseVoidPattern(null);
      this.raise(Errors.UnexpectedVoidPattern, prop.argument);
    } else {
      prop.argument = this.parseIdentifier();
    }
    this.checkCommaAfterRest(125);
    return this.finishNode(prop, "RestElement");
  }
  parseBindingProperty() {
    const {
      type,
      startLoc
    } = this.state;
    if (type === 17) {
      return this.parseBindingRestProperty(this.startNode());
    }
    const prop = this.startNode();
    if (type === 134) {
      this.expectPlugin("destructuringPrivate", startLoc);
      this.classScope.usePrivateName(this.state.value, startLoc);
      prop.key = this.parsePrivateName();
    } else {
      this.parsePropertyName(prop);
    }
    prop.method = false;
    return this.parseObjPropValue(prop, startLoc, false, false, true, false);
  }
  parseBindingElement(flags, decorators) {
    const {
      startLoc
    } = this.state;
    const left = this.parseMaybeDefault();
    if (flags & 2) {
      this.parseFunctionParamType(left);
    }
    if (decorators.length) {
      left.decorators = decorators;
      this.resetStartLocationFromNode(left, decorators[0]);
    }
    const elt = this.parseMaybeDefault(startLoc, left);
    return elt;
  }
  parseFunctionParamType(param) {
    return param;
  }
  parseMaybeDefault(startLoc, left) {
    startLoc ??= this.state.startLoc;
    left = left ?? this.parseBindingAtom();
    if (!this.eat(25)) return left;
    const node = this.startNodeAt(startLoc);
    if (left.type === "VoidPattern") {
      this.raise(Errors.VoidPatternInitializer, left);
    }
    node.left = left;
    node.right = this.parseMaybeAssignAllowIn();
    return this.finishNode(node, "AssignmentPattern");
  }
  isValidLVal(type, disallowCallExpression, isUnparenthesizedInAssign, binding) {
    switch (type) {
      case "AssignmentPattern":
        return "left";
      case "RestElement":
        return "argument";
      case "ObjectProperty":
        return "value";
      case "ParenthesizedExpression":
        return "expression";
      case "ArrayPattern":
        return "elements";
      case "ObjectPattern":
        return "properties";
      case "VoidPattern":
        return true;
      case "CallExpression":
        if (!disallowCallExpression && !this.state.strict && this.optionFlags & 16384) {
          return true;
        }
    }
    return false;
  }
  isOptionalMemberExpression(expression) {
    return expression.type === "OptionalMemberExpression";
  }
  checkLVal(expression, ancestor, binding = 64, checkClashes = false, strictModeChanged = false, hasParenthesizedAncestor = false, disallowCallExpression = false) {
    const type = expression.type;
    if (this.isObjectMethod(expression)) return;
    const isOptionalMemberExpression = this.isOptionalMemberExpression(expression);
    if (isOptionalMemberExpression || type === "MemberExpression") {
      if (isOptionalMemberExpression) {
        this.expectPlugin("optionalChainingAssign", expression.start);
        if (ancestor.type !== "AssignmentExpression") {
          this.raise(Errors.InvalidLhsOptionalChaining, expression, {
            ancestor
          });
        }
      }
      if (binding !== 64) {
        this.raise(Errors.InvalidPropertyBindingPattern, expression);
      }
      return;
    }
    if (type === "Identifier") {
      this.checkIdentifier(expression, binding, strictModeChanged);
      const {
        name
      } = expression;
      if (checkClashes) {
        if (checkClashes.has(name)) {
          this.raise(Errors.ParamDupe, expression);
        } else {
          checkClashes.add(name);
        }
      }
      return;
    } else if (type === "VoidPattern" && ancestor.type === "CatchClause") {
      this.raise(Errors.VoidPatternCatchClauseParam, expression);
    }
    const unwrappedExpression = unwrapParenthesizedExpression(expression);
    disallowCallExpression ||= unwrappedExpression.type === "CallExpression" && (unwrappedExpression.callee.type === "Import" || unwrappedExpression.callee.type === "Super");
    const validity = this.isValidLVal(type, disallowCallExpression, !(hasParenthesizedAncestor || expression.extra?.parenthesized) && ancestor.type === "AssignmentExpression", binding);
    if (validity === true) return;
    if (validity === false) {
      const ParseErrorClass = binding === 64 ? Errors.InvalidLhs : Errors.InvalidLhsBinding;
      this.raise(ParseErrorClass, expression, {
        ancestor
      });
      return;
    }
    let key, isParenthesizedExpression;
    if (typeof validity === "string") {
      key = validity;
      isParenthesizedExpression = type === "ParenthesizedExpression";
    } else {
      [key, isParenthesizedExpression] = validity;
    }
    const nextAncestor = type === "ArrayPattern" || type === "ObjectPattern" ? {
      type
    } : ancestor;
    const val = expression[key];
    if (Array.isArray(val)) {
      for (const child of val) {
        if (child) {
          this.checkLVal(child, nextAncestor, binding, checkClashes, strictModeChanged, isParenthesizedExpression, true);
        }
      }
    } else if (val) {
      this.checkLVal(val, nextAncestor, binding, checkClashes, strictModeChanged, isParenthesizedExpression, disallowCallExpression);
    }
  }
  checkIdentifier(at, bindingType, strictModeChanged = false) {
    if (this.state.strict && (strictModeChanged ? isStrictBindReservedWord(at.name, this.inModule) : isStrictBindOnlyReservedWord(at.name))) {
      if (bindingType === 64) {
        this.raise(Errors.StrictEvalArguments, at, {
          referenceName: at.name
        });
      } else {
        this.raise(Errors.StrictEvalArgumentsBinding, at, {
          bindingName: at.name
        });
      }
    }
    if (bindingType & 8192 && at.name === "let") {
      this.raise(Errors.LetInLexicalBinding, at);
    }
    if (!(bindingType & 64)) {
      this.declareNameFromIdentifier(at, bindingType);
    }
  }
  declareNameFromIdentifier(identifier, binding) {
    this.scope.declareName(identifier.name, binding, identifier.start);
  }
  checkToRestConversion(node, allowPattern) {
    switch (node.type) {
      case "ParenthesizedExpression":
        this.checkToRestConversion(node.expression, allowPattern);
        break;
      case "Identifier":
      case "MemberExpression":
        break;
      case "ArrayExpression":
      case "ObjectExpression":
        if (allowPattern) break;
      default:
        this.raise(Errors.InvalidRestAssignmentPattern, node);
    }
  }
  checkCommaAfterRest(close) {
    if (!this.match(8)) {
      return false;
    }
    this.raise(this.lookaheadCharCode() === close ? Errors.RestTrailingComma : Errors.ElementAfterRest, this.state.startLoc);
    return true;
  }
};
var ExpressionParser = class extends LValParser {
  checkProto(prop, sawProto, refExpressionErrors) {
    if (prop.type === "SpreadElement" || this.isObjectMethod(prop) || prop.computed || prop.shorthand) {
      return sawProto;
    }
    const key = prop.key;
    const name = key.type === "Identifier" ? key.name : key.value;
    if (name === "__proto__") {
      if (sawProto) {
        if (refExpressionErrors) {
          if (refExpressionErrors.doubleProtoLoc === null) {
            refExpressionErrors.doubleProtoLoc = this.getLoc(key.start);
          }
        } else {
          this.raise(Errors.DuplicateProto, key);
        }
      }
      return true;
    }
    return sawProto;
  }
  shouldExitDescending(expr) {
    return expr.type === "ArrowFunctionExpression" && !expr.extra?.parenthesized;
  }
  getExpression() {
    this.enterInitialScopes();
    this.nextToken();
    if (this.match(135)) {
      throw this.raise(Errors.ParseExpressionEmptyInput, this.state.startLoc);
    }
    const expr = this.parseExpression();
    if (!this.match(135)) {
      throw this.raise(Errors.ParseExpressionExpectsEOF, this.state.startLoc, {
        unexpected: this.input.codePointAt(this.state.start)
      });
    }
    this.finalizeRemainingComments();
    expr.comments = this.comments;
    expr.errors = this.state.errors;
    if (this.optionFlags & 512) {
      expr.tokens = createExportedTokens(this.tokens);
    }
    return expr;
  }
  parseExpression(disallowIn, refExpressionErrors) {
    if (disallowIn) {
      return this.disallowInAnd(() => this.parseExpressionBase(refExpressionErrors));
    }
    return this.allowInAnd(() => this.parseExpressionBase(refExpressionErrors));
  }
  parseExpressionBase(refExpressionErrors) {
    const startLoc = this.state.startLoc;
    const expr = this.parseMaybeAssign(refExpressionErrors);
    if (this.match(8)) {
      const node = this.startNodeAt(startLoc);
      node.expressions = [expr];
      while (this.eat(8)) {
        node.expressions.push(this.parseMaybeAssign(refExpressionErrors));
      }
      this.toReferencedList(node.expressions);
      return this.finishNode(node, "SequenceExpression");
    }
    return expr;
  }
  parseMaybeAssignDisallowIn(refExpressionErrors, afterLeftParse) {
    return this.disallowInAnd(() => this.parseMaybeAssign(refExpressionErrors, afterLeftParse));
  }
  parseMaybeAssignAllowIn(refExpressionErrors, afterLeftParse) {
    return this.allowInAnd(() => this.parseMaybeAssign(refExpressionErrors, afterLeftParse));
  }
  setOptionalParametersError(refExpressionErrors) {
    refExpressionErrors.optionalParametersLoc = this.state.startLoc;
  }
  parseMaybeAssign(refExpressionErrors, afterLeftParse) {
    const startLoc = this.state.startLoc;
    const isYield = this.isContextual(104);
    if (isYield) {
      if (this.prodParam.hasYield) {
        this.next();
        let left2 = this.parseYield(startLoc);
        if (afterLeftParse) {
          left2 = afterLeftParse.call(this, left2, startLoc);
        }
        return left2;
      }
    }
    let ownExpressionErrors;
    if (refExpressionErrors) {
      ownExpressionErrors = false;
    } else {
      refExpressionErrors = new ExpressionErrors();
      ownExpressionErrors = true;
    }
    this.state.canStartArrow = true;
    let left = this.parseMaybeConditional(refExpressionErrors);
    if (afterLeftParse) {
      left = afterLeftParse.call(this, left, startLoc);
    }
    if (tokenIsAssignment(this.state.type)) {
      const node = this.startNodeAt(startLoc);
      const operator = this.state.value;
      node.operator = operator;
      if (this.match(25)) {
        this.toAssignable(left, true);
        node.left = left;
        const startIndex = startLoc.index;
        if (refExpressionErrors.doubleProtoLoc != null && refExpressionErrors.doubleProtoLoc.index >= startIndex) {
          refExpressionErrors.doubleProtoLoc = null;
        }
        if (refExpressionErrors.shorthandAssignLoc != null && refExpressionErrors.shorthandAssignLoc.index >= startIndex) {
          refExpressionErrors.shorthandAssignLoc = null;
        }
        if (refExpressionErrors.privateKeyLoc != null && refExpressionErrors.privateKeyLoc.index >= startIndex) {
          this.checkDestructuringPrivate(refExpressionErrors);
          refExpressionErrors.privateKeyLoc = null;
        }
        if (refExpressionErrors.voidPatternLoc != null && refExpressionErrors.voidPatternLoc.index >= startIndex) {
          refExpressionErrors.voidPatternLoc = null;
        }
      } else {
        node.left = left;
      }
      this.next();
      node.right = this.parseMaybeAssign();
      this.checkLVal(left, this.finishNode(node, "AssignmentExpression"), void 0, void 0, void 0, void 0, operator === "||=" || operator === "&&=" || operator === "??=");
      return node;
    } else if (ownExpressionErrors) {
      this.checkExpressionErrors(refExpressionErrors, true);
    }
    if (isYield) {
      const {
        type
      } = this.state;
      const startsExpr2 = this.hasPlugin("v8intrinsic") ? tokenCanStartExpression(type) : tokenCanStartExpression(type) && !this.match(50);
      if (startsExpr2 && !this.isAmbiguousPrefixOrIdentifier()) {
        this.raiseOverwrite(Errors.YieldNotInGeneratorFunction, startLoc);
        return this.parseYield(startLoc);
      }
    }
    return left;
  }
  parseMaybeConditional(refExpressionErrors) {
    const startLoc = this.state.startLoc;
    const expr = this.parseExprOps(refExpressionErrors);
    if (this.shouldExitDescending(expr)) {
      return expr;
    }
    return this.parseConditional(expr, startLoc, refExpressionErrors);
  }
  parseConditional(expr, startLoc, refExpressionErrors) {
    if (this.eat(13)) {
      const node = this.startNodeAt(startLoc);
      node.test = expr;
      node.consequent = this.parseMaybeAssignAllowIn();
      this.expect(10);
      node.alternate = this.parseMaybeAssign();
      return this.finishNode(node, "ConditionalExpression");
    }
    return expr;
  }
  parseMaybeUnaryOrPrivate(refExpressionErrors) {
    return this.match(134) ? this.parsePrivateName() : this.parseMaybeUnary(refExpressionErrors);
  }
  parseExprOps(refExpressionErrors) {
    const startLoc = this.state.startLoc;
    const expr = this.parseMaybeUnaryOrPrivate(refExpressionErrors);
    if (this.shouldExitDescending(expr)) {
      return expr;
    }
    this.state.canStartArrow = false;
    return this.parseExprOp(expr, startLoc, -1);
  }
  parseExprOp(left, leftStartLoc, minPrec) {
    if (this.isPrivateName(left)) {
      const value = this.getPrivateNameSV(left);
      if (minPrec >= tokenOperatorPrecedence(54) || !this.prodParam.hasIn || !this.match(54)) {
        this.raise(Errors.PrivateInExpectedIn, leftStartLoc, {
          identifierName: value
        });
      }
      this.classScope.usePrivateName(value, leftStartLoc);
    }
    const op = this.state.type;
    if (tokenIsOperator(op) && (this.prodParam.hasIn || !this.match(54))) {
      let prec = tokenOperatorPrecedence(op);
      if (prec > minPrec) {
        if (op === 35) {
          this.expectPlugin("pipelineOperator");
          if (this.prodParam.inFSharpPipelineDirectBody) {
            return left;
          }
        }
        const node = this.startNodeAt(leftStartLoc);
        node.left = left;
        node.operator = this.state.value;
        const logical = op === 37 || op === 38;
        const coalesce = op === 36;
        if (coalesce) {
          prec = tokenOperatorPrecedence(38);
        }
        this.next();
        node.right = this.parseExprOpRightExpr(op, prec);
        const finishedNode = this.finishNode(node, logical || coalesce ? "LogicalExpression" : "BinaryExpression");
        const nextOp = this.state.type;
        if (coalesce && (nextOp === 37 || nextOp === 38) || logical && nextOp === 36) {
          throw this.raise(Errors.MixingCoalesceWithLogical, this.state.startLoc);
        }
        return this.parseExprOp(finishedNode, leftStartLoc, minPrec);
      }
    }
    return left;
  }
  parseExprOpRightExpr(op, prec) {
    switch (op) {
      case 35:
        switch (this.getPluginOption("pipelineOperator", "proposal")) {
          case "hack":
            return this.withTopicBindingContext(() => {
              return this.parseHackPipeBody();
            });
          case "fsharp":
            return this.parseFSharpPipelineBody(prec);
        }
      default:
        return this.parseExprOpBaseRightExpr(op, prec);
    }
  }
  parseExprOpBaseRightExpr(op, prec) {
    const startLoc = this.state.startLoc;
    return this.parseExprOp(this.parseMaybeUnaryOrPrivate(), startLoc, tokenIsRightAssociative(op) ? prec - 1 : prec);
  }
  parseHackPipeBody() {
    const {
      startLoc
    } = this.state;
    const body = this.parseMaybeAssign();
    const requiredParentheses = UnparenthesizedPipeBodyDescriptions.has(body.type);
    if (requiredParentheses && !body.extra?.parenthesized) {
      this.raise(Errors.PipeUnparenthesizedBody, startLoc, {
        type: body.type
      });
    }
    if (!this.topicReferenceWasUsedInCurrentContext()) {
      this.raise(Errors.PipeTopicUnused, startLoc);
    }
    return body;
  }
  checkExponentialAfterUnary(node) {
    if (this.match(53)) {
      this.raise(Errors.UnexpectedTokenUnaryExponentiation, node.argument);
    }
  }
  parseMaybeUnary(refExpressionErrors, sawUnary) {
    const startLoc = this.state.startLoc;
    const isAwait = this.isContextual(92);
    if (isAwait && this.recordAwaitIfAllowed()) {
      this.next();
      const expr2 = this.parseAwait(startLoc);
      if (!sawUnary) this.checkExponentialAfterUnary(expr2);
      return expr2;
    }
    const update = this.match(30);
    const node = this.startNode();
    if (tokenIsPrefix(this.state.type)) {
      node.operator = this.state.value;
      node.prefix = true;
      this.state.canStartArrow = false;
      if (this.match(68)) {
        this.expectPlugin("throwExpressions");
      }
      const isDelete = this.match(85);
      this.next();
      node.argument = this.parseMaybeUnary(null, true);
      this.checkExpressionErrors(refExpressionErrors, true);
      if (this.state.strict && isDelete) {
        const arg = node.argument;
        if (arg.type === "Identifier") {
          this.raise(Errors.StrictDelete, node);
        } else if (this.hasPropertyAsPrivateName(arg)) {
          this.raise(Errors.DeletePrivateField, node);
        }
      }
      if (!update) {
        if (!sawUnary) {
          this.checkExponentialAfterUnary(node);
        }
        return this.finishNode(node, "UnaryExpression");
      }
    }
    const expr = this.parseUpdate(node, update, refExpressionErrors);
    if (isAwait) {
      const {
        type
      } = this.state;
      const startsExpr2 = this.hasPlugin("v8intrinsic") ? tokenCanStartExpression(type) : tokenCanStartExpression(type) && !this.match(50);
      if (startsExpr2 && !this.isAmbiguousPrefixOrIdentifier()) {
        this.raiseOverwrite(Errors.AwaitNotInAsyncContext, startLoc);
        return this.parseAwait(startLoc);
      }
    }
    return expr;
  }
  parseUpdate(node, update, refExpressionErrors) {
    if (update) {
      const result = this.finishNode(node, "UpdateExpression");
      this.checkLVal(result.argument, result);
      return result;
    }
    const startLoc = this.state.startLoc;
    let expr = this.parseExprSubscripts(refExpressionErrors);
    if (this.checkExpressionErrors(refExpressionErrors, false)) return expr;
    while (tokenIsPostfix(this.state.type) && !this.canInsertSemicolon()) {
      const node2 = this.startNodeAt(startLoc);
      node2.operator = this.state.value;
      node2.prefix = false;
      node2.argument = expr;
      this.next();
      this.checkLVal(expr, expr = this.finishNode(node2, "UpdateExpression"));
    }
    return expr;
  }
  parseExprSubscripts(refExpressionErrors) {
    const startLoc = this.state.startLoc;
    this.setLoc(startLoc);
    const expr = this.parseExprAtom(refExpressionErrors);
    if (this.shouldExitDescending(expr)) {
      return expr;
    }
    return this.parseSubscripts(expr, startLoc);
  }
  parseSubscripts(base, startLoc, noCalls) {
    const state = {
      optionalChainMember: false,
      maybeAsyncArrow: this.atPossibleAsyncArrow(base),
      stop: false
    };
    do {
      base = this.parseSubscript(base, startLoc, noCalls, state);
      state.maybeAsyncArrow = false;
    } while (!state.stop);
    return base;
  }
  parseSubscript(base, startLoc, noCalls, state) {
    const {
      type
    } = this.state;
    if (!noCalls && type === 11) {
      return this.parseBind(base, startLoc, state);
    } else if (tokenIsTemplate(type)) {
      return this.parseTaggedTemplateExpression(base, startLoc, state);
    }
    let optional = false;
    if (type === 14) {
      if (noCalls) {
        this.raise(Errors.OptionalChainingNoNew, this.state.startLoc);
        if (this.lookaheadCharCode() === 40) {
          return this.stopParseSubscript(base, state);
        }
      }
      state.optionalChainMember = optional = true;
      this.next();
    }
    if (!noCalls && this.match(6)) {
      return this.parseCoverCallAndAsyncArrowHead(base, startLoc, state, optional);
    } else {
      const computed = this.eat(0);
      if (computed || optional || this.eat(12)) {
        return this.parseMember(base, startLoc, state, computed, optional);
      } else {
        return this.stopParseSubscript(base, state);
      }
    }
  }
  stopParseSubscript(base, state) {
    state.stop = true;
    return base;
  }
  parseMember(base, startLoc, state, computed, optional) {
    const node = this.startNodeAt(startLoc);
    node.object = base;
    node.computed = computed;
    if (computed) {
      node.property = this.parseExpression();
      this.expect(1);
    } else if (this.match(134)) {
      if (base.type === "Super") {
        this.raise(Errors.SuperPrivateField, startLoc);
      }
      this.classScope.usePrivateName(this.state.value, this.state.startLoc);
      node.property = this.parsePrivateName();
    } else {
      node.property = this.parseIdentifier(true);
    }
    if (state.optionalChainMember) {
      node.optional = optional;
      return this.finishNode(node, "OptionalMemberExpression");
    } else {
      return this.finishNode(node, "MemberExpression");
    }
  }
  parseBind(base, startLoc, state) {
    const node = this.startNodeAt(startLoc);
    node.object = base;
    this.next();
    const isImport = this.match(79);
    const callee = this.parseNoCallExpr();
    if (callee.type === "Super" || isImport && callee.type === "ImportExpression" || callee.type === "Import") {
      throw this.raise(Errors.UnsupportedBindRHS, callee);
    }
    node.callee = callee;
    state.stop = true;
    return this.parseSubscripts(this.finishNode(node, "BindExpression"), startLoc, false);
  }
  parseCoverCallAndAsyncArrowHead(base, startLoc, state, optional) {
    let refExpressionErrors = null;
    this.next();
    const node = this.startNodeAt(startLoc);
    node.callee = base;
    const {
      maybeAsyncArrow,
      optionalChainMember
    } = state;
    if (maybeAsyncArrow) {
      this.expressionScope.enter(newAsyncArrowScope());
      refExpressionErrors = new ExpressionErrors();
    }
    if (optionalChainMember) {
      node.optional = optional;
    }
    if (optional) {
      node.arguments = this.parseCallExpressionArguments();
    } else {
      node.arguments = this.parseCallExpressionArguments(base.type !== "Super", node, refExpressionErrors);
    }
    let finishedNode = this.finishCallExpression(node, optionalChainMember);
    if (maybeAsyncArrow && this.shouldParseAsyncArrow() && !optional) {
      state.stop = true;
      this.checkDestructuringPrivate(refExpressionErrors);
      this.expressionScope.validateAsPattern();
      this.expressionScope.exit();
      finishedNode = this.parseAsyncArrowFromCallExpression(this.startNodeAt(startLoc), finishedNode);
    } else {
      if (maybeAsyncArrow) {
        this.checkExpressionErrors(refExpressionErrors, true);
        this.expressionScope.exit();
      }
      this.toReferencedList(node.arguments);
    }
    return finishedNode;
  }
  parseTaggedTemplateExpression(base, startLoc, state) {
    const node = this.startNodeAt(startLoc);
    node.tag = base;
    node.quasi = this.parseTemplate(true);
    if (state.optionalChainMember) {
      this.raise(Errors.OptionalChainingNoTemplate, startLoc);
    }
    return this.finishNode(node, "TaggedTemplateExpression");
  }
  atPossibleAsyncArrow(base) {
    return base.type === "Identifier" && base.name === "async" && this.state.lastTokEndLoc.index === base.end && !this.canInsertSemicolon() && base.end - base.start === 5 && this.state.canStartArrow;
  }
  finishCallExpression(node, optional) {
    if (node.callee.type === "Import") {
      if (node.arguments.length === 0 || node.arguments.length > 2) {
        this.raise(Errors.ImportCallArity, node);
      } else {
        for (const arg of node.arguments) {
          if (arg.type === "SpreadElement") {
            this.raise(Errors.ImportCallSpreadArgument, arg);
          }
        }
      }
    }
    return this.finishNode(node, optional ? "OptionalCallExpression" : "CallExpression");
  }
  parseCallExpressionArguments(allowPlaceholder, nodeForExtra, refExpressionErrors) {
    const elts = [];
    let first = true;
    while (!this.eat(7)) {
      if (first) {
        first = false;
      } else {
        this.expect(8);
        if (this.match(7)) {
          if (nodeForExtra) {
            this.addTrailingCommaExtraToNode(nodeForExtra);
          }
          this.next();
          break;
        }
      }
      elts.push(this.parseExprListItem(7, false, refExpressionErrors, allowPlaceholder));
    }
    return elts;
  }
  shouldParseAsyncArrow() {
    return this.match(15) && !this.canInsertSemicolon();
  }
  parseAsyncArrowFromCallExpression(node, call) {
    this.resetPreviousNodeTrailingComments(call);
    this.expect(15);
    this.parseArrowExpression(node, call.arguments, true, call.extra?.trailingCommaLoc);
    if (call.innerComments) {
      setInnerComments(node, call.innerComments);
    }
    if (call.callee.trailingComments) {
      setInnerComments(node, call.callee.trailingComments);
    }
    return node;
  }
  parseNoCallExpr() {
    const startLoc = this.state.startLoc;
    return this.parseSubscripts(this.parseExprAtom(), startLoc, true);
  }
  parseExprAtom(refExpressionErrors) {
    let node;
    let decorators = null;
    const {
      type
    } = this.state;
    switch (type) {
      case 75:
        return this.parseSuper();
      case 79:
        node = this.startNode();
        this.next();
        if (this.match(12)) {
          return this.parseImportMetaPropertyOrPhaseCall(node);
        }
        if (this.match(6)) {
          if (this.optionFlags & 1024) {
            return this.parseImportCall(node);
          } else {
            return this.finishNode(node, "Import");
          }
        } else {
          this.raise(Errors.UnsupportedImport, this.state.lastTokStartLoc);
          return this.finishNode(node, "Import");
        }
      case 74:
        node = this.startNode();
        this.next();
        return this.finishNode(node, "ThisExpression");
      case 86: {
        return this.parseDo(this.startNode(), false);
      }
      case 52:
      case 27: {
        this.readRegexp();
        return this.parseRegExpLiteral(this.state.value);
      }
      case 131:
        return this.parseNumericLiteral(this.state.value);
      case 132:
        return this.parseBigIntLiteral(this.state.value);
      case 130:
        return this.parseStringLiteral(this.state.value);
      case 80:
        return this.parseNullLiteral();
      case 81:
        return this.parseBooleanLiteral(true);
      case 82:
        return this.parseBooleanLiteral(false);
      case 6: {
        return this.parseParenAndDistinguishExpression(this.state.canStartArrow);
      }
      case 0: {
        return this.parseArrayLike(1, refExpressionErrors);
      }
      case 2: {
        return this.parseObjectLike(4, false, refExpressionErrors);
      }
      case 64:
        return this.parseFunctionOrFunctionSent();
      case 22:
        decorators = this.parseDecorators();
      case 76:
        return this.parseClass(this.maybeTakeDecorators(decorators, this.startNode()), false);
      case 73:
        return this.parseNewOrNewTarget();
      case 21:
      case 20:
        return this.parseTemplate(false);
      case 11: {
        node = this.startNode();
        this.next();
        node.object = null;
        const callee = node.callee = this.parseNoCallExpr();
        if (callee.type === "MemberExpression") {
          return this.finishNode(node, "BindExpression");
        } else {
          throw this.raise(Errors.UnsupportedBind, callee);
        }
      }
      case 134: {
        this.raise(Errors.PrivateInExpectedIn, this.state.startLoc, {
          identifierName: this.state.value
        });
        return this.parsePrivateName();
      }
      case 29: {
        return this.parseTopicReferenceThenEqualsSign(50, "%");
      }
      case 28: {
        return this.parseTopicReferenceThenEqualsSign(40, "^");
      }
      case 33:
      case 34: {
        return this.parseTopicReference("hack");
      }
      case 40:
      case 50:
      case 23: {
        const pipeProposal = this.getPluginOption("pipelineOperator", "proposal");
        if (pipeProposal) {
          return this.parseTopicReference(pipeProposal);
        }
        throw this.unexpected();
      }
      case 43: {
        const lookaheadCh = this.input.codePointAt(this.nextTokenStart());
        if (isIdentifierStart(lookaheadCh) || lookaheadCh === 62) {
          throw this.expectOnePlugin(["jsx", "flow", "typescript"]);
        }
        throw this.unexpected();
      }
      default:
        if (tokenIsIdentifier(type)) {
          if (this.isContextual(123) && this.lookaheadInLineCharCode() === 123) {
            return this.parseModuleExpression();
          }
          const {
            canStartArrow,
            containsEsc
          } = this.state;
          const id = this.parseIdentifier();
          if (!containsEsc && id.name === "async" && !this.canInsertSemicolon()) {
            const {
              type: type2
            } = this.state;
            if (type2 === 64) {
              this.resetPreviousNodeTrailingComments(id);
              this.next();
              return this.parseAsyncFunctionExpression(this.startNodeAtNode(id));
            } else if (tokenIsIdentifier(type2)) {
              if (canStartArrow && this.lookaheadCharCode() === 61) {
                return this.parseAsyncArrowUnaryFunction(this.startNodeAtNode(id));
              } else {
                return id;
              }
            } else if (type2 === 86) {
              this.resetPreviousNodeTrailingComments(id);
              return this.parseDo(this.startNodeAtNode(id), true);
            }
          }
          if (canStartArrow && this.match(15) && !this.canInsertSemicolon()) {
            this.next();
            return this.parseArrowExpression(this.startNodeAtNode(id), [id], false);
          }
          return id;
        } else {
          throw this.unexpected();
        }
    }
  }
  parseTopicReferenceThenEqualsSign(topicTokenType, topicTokenValue) {
    const pipeProposal = this.getPluginOption("pipelineOperator", "proposal");
    if (pipeProposal) {
      this.state.type = topicTokenType;
      this.state.value = topicTokenValue;
      this.state.pos--;
      this.state.end--;
      this.state.endLoc = createPositionWithColumnOffset(this.state.endLoc, -1);
      return this.parseTopicReference(pipeProposal);
    }
    throw this.unexpected();
  }
  parseTopicReference(pipeProposal) {
    const node = this.startNode();
    const startLoc = this.state.startLoc;
    const tokenType = this.state.type;
    this.next();
    return this.finishTopicReference(node, startLoc, pipeProposal, tokenType);
  }
  finishTopicReference(node, startLoc, pipeProposal, tokenType) {
    if (this.testTopicReferenceConfiguration(pipeProposal, startLoc, tokenType)) {
      if (!this.topicReferenceIsAllowedInCurrentContext()) {
        this.raise(Errors.PipeTopicUnbound, startLoc);
      }
      this.registerTopicReference();
      return this.finishNode(node, "TopicReference");
    } else {
      throw this.raise(Errors.PipeTopicUnconfiguredToken, startLoc, {
        token: tokenLabelName(tokenType)
      });
    }
  }
  testTopicReferenceConfiguration(pipeProposal, startLoc, tokenType) {
    switch (pipeProposal) {
      case "hack": {
        return this.hasPlugin(["pipelineOperator", {
          topicToken: tokenLabelName(tokenType)
        }]);
      }
      default:
        throw this.raise(Errors.PipeTopicRequiresHackPipes, startLoc);
    }
  }
  parseAsyncArrowUnaryFunction(node) {
    this.prodParam.enter(functionFlags(true, this.prodParam.hasYield));
    const params = [this.parseIdentifier()];
    this.prodParam.exit();
    if (this.hasPrecedingLineBreak()) {
      this.raise(Errors.LineTerminatorBeforeArrow, this.state.curPosition());
    }
    this.expect(15);
    return this.parseArrowExpression(node, params, true);
  }
  parseDo(node, isAsync) {
    this.expectPlugin("doExpressions");
    if (isAsync) {
      this.expectPlugin("asyncDoExpressions");
    }
    node.async = isAsync;
    this.next();
    const oldLabels = this.state.labels;
    this.state.labels = [];
    if (isAsync) {
      this.prodParam.enter(2);
      node.body = this.parseBlock();
      this.prodParam.exit();
    } else {
      node.body = this.parseBlock();
    }
    this.state.labels = oldLabels;
    return this.finishNode(node, "DoExpression");
  }
  parseSuper() {
    const node = this.startNode();
    this.next();
    if (this.match(6) && !this.scope.allowDirectSuper) {
      this.raise(Errors.SuperNotAllowed, node);
    } else if (!this.scope.allowSuper) {
      this.raise(Errors.UnexpectedSuper, node);
    }
    if (!this.match(6) && !this.match(0) && !this.match(12)) {
      this.raise(Errors.UnsupportedSuper, node);
    }
    return this.finishNode(node, "Super");
  }
  parsePrivateName() {
    const node = this.startNode();
    const id = this.startNodeAt(createPositionWithColumnOffset(this.state.startLoc, 1));
    const name = this.state.value;
    this.next();
    node.id = this.createIdentifier(id, name);
    return this.finishNode(node, "PrivateName");
  }
  parseFunctionOrFunctionSent() {
    const node = this.startNode();
    this.next();
    if (this.prodParam.hasYield && this.match(12)) {
      const meta = this.createIdentifier(this.startNodeAtNode(node), "function");
      this.next();
      if (this.match(99)) {
        this.expectPlugin("functionSent");
      } else if (!this.hasPlugin("functionSent")) {
        this.unexpected();
      }
      return this.parseMetaProperty(node, meta, "sent");
    }
    return this.parseFunction(node);
  }
  parseMetaProperty(node, meta, propertyName) {
    node.meta = meta;
    const containsEsc = this.state.containsEsc;
    node.property = this.parseIdentifier(true);
    if (node.property.name !== propertyName || containsEsc) {
      this.raise(Errors.UnsupportedMetaProperty, node.property, {
        target: meta.name,
        onlyValidPropertyName: propertyName
      });
    }
    return this.finishNode(node, "MetaProperty");
  }
  parseImportMetaPropertyOrPhaseCall(node) {
    this.next();
    if (this.isContextual(101) || this.isContextual(93)) {
      const isSource = this.isContextual(101);
      this.expectPlugin(isSource ? "sourcePhaseImports" : "deferredImportEvaluation");
      this.next();
      node.phase = isSource ? "source" : "defer";
      return this.parseImportCall(node);
    } else {
      const id = this.createIdentifierAt(this.startNodeAtNode(node), "import", this.state.lastTokStartLoc);
      if (this.isContextual(97)) {
        if (!this.inModule) {
          this.raise(Errors.ImportMetaOutsideModule, id);
        }
        this.sawUnambiguousESM = true;
      }
      return this.parseMetaProperty(node, id, "meta");
    }
  }
  parseLiteralAtNode(value, type, node) {
    this.addExtra(node, "rawValue", value);
    this.addExtra(node, "raw", this.input.slice(this.offsetToSourcePos(node.start), this.state.end));
    node.value = value;
    this.next();
    return this.finishNode(node, type);
  }
  parseLiteral(value, type) {
    const node = this.startNode();
    return this.parseLiteralAtNode(value, type, node);
  }
  parseStringLiteral(value) {
    return this.parseLiteral(value, "StringLiteral");
  }
  parseNumericLiteral(value) {
    return this.parseLiteral(value, "NumericLiteral");
  }
  parseBigIntLiteral(value) {
    let bigInt;
    try {
      bigInt = BigInt(value);
    } catch {
      bigInt = null;
    }
    const node = this.parseLiteral(bigInt, "BigIntLiteral");
    return node;
  }
  parseRegExpLiteral(value) {
    const node = this.startNode();
    this.addExtra(node, "raw", this.input.slice(this.offsetToSourcePos(node.start), this.state.end));
    node.pattern = value.pattern;
    node.flags = value.flags;
    this.next();
    return this.finishNode(node, "RegExpLiteral");
  }
  parseBooleanLiteral(value) {
    const node = this.startNode();
    node.value = value;
    this.next();
    return this.finishNode(node, "BooleanLiteral");
  }
  parseNullLiteral() {
    const node = this.startNode();
    this.next();
    return this.finishNode(node, "NullLiteral");
  }
  parseParenAndDistinguishExpression(canStartArrow) {
    const startLoc = this.state.startLoc;
    let val;
    this.next();
    this.expressionScope.enter(newArrowHeadScope());
    const innerStartLoc = this.state.startLoc;
    const exprList = [];
    const refExpressionErrors = new ExpressionErrors();
    let first = true;
    let spreadStartLoc;
    let optionalCommaStartLoc;
    while (!this.match(7)) {
      if (first) {
        first = false;
      } else {
        this.expect(8, refExpressionErrors.optionalParametersLoc === null ? null : refExpressionErrors.optionalParametersLoc);
        if (this.match(7)) {
          optionalCommaStartLoc = this.state.startLoc;
          break;
        }
      }
      if (this.match(17)) {
        const spreadNodeStartLoc = this.state.startLoc;
        spreadStartLoc = this.state.startLoc;
        exprList.push(this.parseParenItem(this.parseRestBinding(), spreadNodeStartLoc));
        if (!this.checkCommaAfterRest(41)) {
          break;
        }
      } else {
        exprList.push(this.parseMaybeAssignAllowInOrVoidPattern(7, refExpressionErrors, this.parseParenItem));
      }
    }
    const innerEndLoc = this.state.lastTokEndLoc;
    this.expect(7);
    let arrowNode = this.startNodeAt(startLoc);
    if (canStartArrow && this.shouldParseArrow(exprList) && (arrowNode = this.parseArrow(arrowNode))) {
      this.checkDestructuringPrivate(refExpressionErrors);
      this.expressionScope.validateAsPattern();
      this.expressionScope.exit();
      this.parseArrowExpression(arrowNode, exprList, false);
      return arrowNode;
    }
    this.expressionScope.exit();
    if (!exprList.length) {
      this.unexpected(this.state.lastTokStartLoc);
    }
    if (optionalCommaStartLoc) this.unexpected(optionalCommaStartLoc);
    if (spreadStartLoc) this.unexpected(spreadStartLoc);
    this.checkExpressionErrors(refExpressionErrors, true);
    this.toReferencedList(exprList, true);
    if (exprList.length > 1) {
      val = this.startNodeAt(innerStartLoc);
      val.expressions = exprList;
      this.finishNode(val, "SequenceExpression");
      this.resetEndLocation(val, innerEndLoc);
    } else {
      val = exprList[0];
    }
    return this.wrapParenthesis(startLoc, val);
  }
  wrapParenthesis(startLoc, expression) {
    if (!(this.optionFlags & 2048)) {
      this.addExtra(expression, "parenthesized", true);
      this.addExtra(expression, "parenStart", startLoc.index);
      this.takeSurroundingComments(expression, startLoc.index, this.state.lastTokEndLoc.index);
      return expression;
    }
    const parenExpression = this.startNodeAt(startLoc);
    parenExpression.expression = expression;
    return this.finishNode(parenExpression, "ParenthesizedExpression");
  }
  shouldParseArrow(params) {
    return !this.canInsertSemicolon();
  }
  parseArrow(node) {
    if (this.eat(15)) {
      return node;
    }
  }
  parseParenItem(node, startLoc) {
    return node;
  }
  parseNewOrNewTarget() {
    const node = this.startNode();
    this.next();
    if (this.match(12)) {
      const meta = this.createIdentifier(this.startNodeAtNode(node), "new");
      this.next();
      const metaProp = this.parseMetaProperty(node, meta, "target");
      if (!this.scope.allowNewTarget) {
        this.raise(Errors.UnexpectedNewTarget, metaProp);
      }
      return metaProp;
    }
    return this.parseNew(node);
  }
  parseNew(node) {
    this.parseNewCallee(node);
    if (this.eat(6)) {
      const args = this.parseExprList(7);
      this.toReferencedList(args);
      node.arguments = args;
    } else {
      node.arguments = [];
    }
    return this.finishNode(node, "NewExpression");
  }
  parseNewCallee(node) {
    const isImport = this.match(79);
    const callee = this.parseNoCallExpr();
    node.callee = callee;
    if (isImport && callee.type === "ImportExpression") {
      this.raise(Errors.ImportCallNotNewExpression, callee, callee);
    }
    if (callee.type === "Import") {
      this.raise(Errors.ImportCallNotNewExpression, callee);
    }
    if (callee.type === "Super") {
      this.raise(Errors.SuperCallNotNewExpression, callee);
    }
  }
  parseTemplateElement(isTagged) {
    const {
      start,
      startLoc,
      end,
      value
    } = this.state;
    const elemStart = start + 1;
    const elem = this.startNodeAt(createPositionWithColumnOffset(startLoc, 1));
    if (value === null) {
      if (!isTagged) {
        this.raise(Errors.InvalidEscapeSequenceTemplate, createPositionWithColumnOffset(this.state.firstInvalidTemplateEscapePos, 1));
      }
    }
    const isTail = this.match(20);
    const endOffset = isTail ? -1 : -2;
    const elemEnd = end + endOffset;
    elem.value = {
      raw: this.input.slice(elemStart, elemEnd).replace(/\r\n?/g, "\n"),
      cooked: value === null ? null : value.slice(1, endOffset)
    };
    elem.tail = isTail;
    this.next();
    const finishedNode = this.finishNode(elem, "TemplateElement");
    this.resetEndLocation(finishedNode, createPositionWithColumnOffset(this.state.lastTokEndLoc, endOffset));
    return finishedNode;
  }
  parseTemplate(isTagged) {
    const node = this.startNode();
    let curElt = this.parseTemplateElement(isTagged);
    const quasis = [curElt];
    const substitutions = [];
    while (!curElt.tail) {
      substitutions.push(this.parseTemplateSubstitution());
      this.readTemplateContinuation();
      quasis.push(curElt = this.parseTemplateElement(isTagged));
    }
    node.expressions = substitutions;
    node.quasis = quasis;
    return this.finishNode(node, "TemplateLiteral");
  }
  parseTemplateSubstitution() {
    return this.parseExpression();
  }
  parseObjectLike(close, isPattern, refExpressionErrors) {
    let sawProto = false;
    let first = true;
    const node = this.startNode();
    node.properties = [];
    this.next();
    while (!this.match(close)) {
      if (first) {
        first = false;
      } else {
        this.expect(8);
        if (this.match(close)) {
          this.addTrailingCommaExtraToNode(node);
          break;
        }
      }
      let prop;
      if (isPattern) {
        prop = this.parseBindingProperty();
      } else {
        prop = this.parsePropertyDefinition(refExpressionErrors);
        sawProto = this.checkProto(prop, sawProto, refExpressionErrors);
      }
      node.properties.push(prop);
    }
    this.next();
    const type = isPattern ? "ObjectPattern" : "ObjectExpression";
    return this.finishNode(node, type);
  }
  addTrailingCommaExtraToNode(node) {
    this.addExtra(node, "trailingComma", this.state.lastTokStartLoc.index);
    this.addExtra(node, "trailingCommaLoc", this.state.lastTokStartLoc, false);
  }
  maybeAsyncOrAccessorProp(prop) {
    return !prop.computed && prop.key.type === "Identifier" && (this.isLiteralPropertyName() || this.match(0) || this.match(51));
  }
  parsePropertyDefinition(refExpressionErrors) {
    const decorators = [];
    if (this.match(22)) {
      if (this.hasPlugin("decorators")) {
        this.raise(Errors.UnsupportedPropertyDecorator, this.state.startLoc);
      }
      while (this.match(22)) {
        decorators.push(this.parseDecorator());
      }
    }
    const prop = this.startNode();
    let isAsync = false;
    let isAccessor = false;
    let startLoc;
    if (this.match(17)) {
      if (decorators.length) this.unexpected();
      return this.parseSpread();
    }
    if (decorators.length) {
      prop.decorators = decorators;
    }
    prop.method = false;
    if (refExpressionErrors) {
      startLoc = this.state.startLoc;
    }
    let isGenerator = this.eat(51);
    this.parsePropertyNamePrefixOperator(prop);
    const containsEsc = this.state.containsEsc;
    this.parsePropertyName(prop, refExpressionErrors);
    if (!isGenerator && !containsEsc && this.maybeAsyncOrAccessorProp(prop)) {
      const {
        key
      } = prop;
      const keyName = key.name;
      if (keyName === "async" && !this.hasPrecedingLineBreak()) {
        isAsync = true;
        this.resetPreviousNodeTrailingComments(key);
        isGenerator = this.eat(51);
        this.parsePropertyName(prop);
      }
      if (keyName === "get" || keyName === "set") {
        isAccessor = true;
        this.resetPreviousNodeTrailingComments(key);
        prop.kind = keyName;
        if (this.match(51)) {
          isGenerator = true;
          this.raise(Errors.AccessorIsGenerator, this.state.curPosition(), {
            kind: keyName
          });
          this.next();
        }
        this.parsePropertyName(prop);
      }
    }
    return this.parseObjPropValue(prop, startLoc, isGenerator, isAsync, false, isAccessor, refExpressionErrors);
  }
  getGetterSetterExpectedParamCount(method) {
    return method.kind === "get" ? 0 : 1;
  }
  getObjectOrClassMethodParams(method) {
    return method.params;
  }
  checkGetterSetterParams(method) {
    const paramCount = this.getGetterSetterExpectedParamCount(method);
    const params = this.getObjectOrClassMethodParams(method);
    if (params.length !== paramCount) {
      this.raise(method.kind === "get" ? Errors.BadGetterArity : Errors.BadSetterArity, method);
    }
    if (method.kind === "set" && params[params.length - 1]?.type === "RestElement") {
      this.raise(Errors.BadSetterRestParameter, method);
    }
  }
  parseObjectMethod(prop, isGenerator, isAsync, isPattern, isAccessor) {
    if (isAccessor) {
      const finishedProp = this.parseMethod(prop, isGenerator, false, false, false, "ObjectMethod");
      this.checkGetterSetterParams(finishedProp);
      return finishedProp;
    }
    if (isAsync || isGenerator || this.match(6)) {
      if (isPattern) this.unexpected();
      prop.kind = "method";
      prop.method = true;
      return this.parseMethod(prop, isGenerator, isAsync, false, false, "ObjectMethod");
    }
  }
  parseObjectProperty(prop, startLoc, isPattern, refExpressionErrors) {
    prop.shorthand = false;
    if (this.eat(10)) {
      prop.value = isPattern ? this.parseMaybeDefault(this.state.startLoc) : this.parseMaybeAssignAllowInOrVoidPattern(4, refExpressionErrors);
      return this.finishObjectProperty(prop);
    }
    if (!prop.computed && prop.key.type === "Identifier") {
      this.checkReservedWord(prop.key.name, prop.key.start, true, false);
      if (isPattern) {
        prop.value = this.parseMaybeDefault(startLoc, this.cloneIdentifier(prop.key));
      } else if (this.match(25)) {
        const shorthandAssignLoc = this.state.startLoc;
        if (refExpressionErrors != null) {
          if (refExpressionErrors.shorthandAssignLoc === null) {
            refExpressionErrors.shorthandAssignLoc = shorthandAssignLoc;
          }
        } else {
          this.raise(Errors.InvalidCoverInitializedName, shorthandAssignLoc);
        }
        prop.value = this.parseMaybeDefault(startLoc, this.cloneIdentifier(prop.key));
      } else {
        prop.value = this.cloneIdentifier(prop.key);
      }
      prop.shorthand = true;
      return this.finishObjectProperty(prop);
    }
  }
  finishObjectProperty(node) {
    return this.finishNode(node, "ObjectProperty");
  }
  parseObjPropValue(prop, startLoc, isGenerator, isAsync, isPattern, isAccessor, refExpressionErrors) {
    const node = this.parseObjectMethod(prop, isGenerator, isAsync, isPattern, isAccessor) || this.parseObjectProperty(prop, startLoc, isPattern, refExpressionErrors);
    if (!node) this.unexpected();
    return node;
  }
  parsePropertyName(prop, refExpressionErrors) {
    if (this.eat(0)) {
      prop.computed = true;
      prop.key = this.parseMaybeAssignAllowIn();
      this.expect(1);
    } else {
      const {
        type,
        value
      } = this.state;
      let key;
      if (tokenIsKeywordOrIdentifier(type)) {
        key = this.parseIdentifier(true);
      } else {
        switch (type) {
          case 131:
            key = this.parseNumericLiteral(value);
            break;
          case 130:
            key = this.parseStringLiteral(value);
            break;
          case 132:
            key = this.parseBigIntLiteral(value);
            break;
          case 134: {
            const privateKeyLoc = this.state.startLoc;
            if (refExpressionErrors != null) {
              if (refExpressionErrors.privateKeyLoc === null) {
                refExpressionErrors.privateKeyLoc = privateKeyLoc;
              }
            } else {
              this.raise(Errors.UnexpectedPrivateField, privateKeyLoc);
            }
            key = this.parsePrivateName();
            break;
          }
          default:
            this.unexpected();
        }
      }
      prop.key = key;
      if (type !== 134) {
        prop.computed = false;
      }
    }
  }
  initFunction(node, isAsync) {
    node.id = null;
    node.generator = false;
    node.async = isAsync;
  }
  parseMethod(node, isGenerator, isAsync, isConstructor, allowDirectSuper, type, inClassScope = false) {
    this.initFunction(node, isAsync);
    node.generator = isGenerator;
    this.scope.enter(514 | 16 | (inClassScope ? 576 : 0) | (allowDirectSuper ? 32 : 0));
    this.prodParam.enter(functionFlags(isAsync, node.generator));
    this.parseFunctionParams(node, isConstructor);
    const finishedNode = this.parseFunctionBodyAndFinish(node, type, true);
    this.prodParam.exit();
    this.scope.exit();
    return finishedNode;
  }
  parseArrayLike(close, refExpressionErrors) {
    const node = this.startNode();
    this.next();
    node.elements = this.parseExprList(close, true, refExpressionErrors, node);
    return this.finishNode(node, "ArrayExpression");
  }
  parseArrowExpression(node, params, isAsync, trailingCommaLoc) {
    this.scope.enter(514 | 4);
    let flags = functionFlags(isAsync, false);
    if (!this.match(2)) {
      flags |= this.prodParam.currentFlags() & (8 | 16);
    }
    this.prodParam.enter(flags);
    this.initFunction(node, isAsync);
    if (params) {
      this.setArrowFunctionParameters(node, params, trailingCommaLoc);
    }
    this.parseFunctionBody(node, true);
    this.prodParam.exit();
    this.scope.exit();
    return this.finishNode(node, "ArrowFunctionExpression");
  }
  setArrowFunctionParameters(node, params, trailingCommaLoc) {
    this.toAssignableList(params, trailingCommaLoc, false);
    node.params = params;
  }
  parseFunctionBodyAndFinish(node, type, isMethod = false) {
    this.parseFunctionBody(node, false, isMethod);
    return this.finishNode(node, type);
  }
  parseFunctionBody(node, allowExpression, isMethod = false) {
    const isExpression = allowExpression && !this.match(2);
    this.expressionScope.enter(newExpressionScope());
    if (isExpression) {
      node.body = this.parseMaybeAssign();
      this.checkParams(node, false, allowExpression, false);
    } else {
      const oldStrict = this.state.strict;
      const oldLabels = this.state.labels;
      this.state.labels = [];
      this.prodParam.enter(this.prodParam.currentFlags() | 4);
      node.body = this.parseBlock(true, false, (hasStrictModeDirective) => {
        const nonSimple = !this.isSimpleParamList(node.params);
        if (hasStrictModeDirective && nonSimple) {
          this.raise(Errors.IllegalLanguageModeDirective, (node.kind === "method" || node.kind === "constructor") && !!node.key ? this.optionFlags & 256 ? node.key.loc.end : node.key : node);
        }
        const strictModeChanged = !oldStrict && this.state.strict;
        this.checkParams(node, !this.state.strict && !allowExpression && !isMethod && !nonSimple, allowExpression, strictModeChanged);
        if (this.state.strict && node.id) {
          this.checkIdentifier(node.id, 65, strictModeChanged);
        }
      });
      this.prodParam.exit();
      this.state.labels = oldLabels;
    }
    this.expressionScope.exit();
  }
  isSimpleParameter(node) {
    return node.type === "Identifier";
  }
  isSimpleParamList(params) {
    for (let i = 0, len = params.length; i < len; i++) {
      if (!this.isSimpleParameter(params[i])) return false;
    }
    return true;
  }
  checkParams(node, allowDuplicates, isArrowFunction, strictModeChanged = true) {
    const checkClashes = !allowDuplicates && /* @__PURE__ */ new Set();
    const formalParameters = {
      type: "FormalParameters"
    };
    for (const param of node.params) {
      this.checkLVal(param, formalParameters, 5, checkClashes, strictModeChanged);
    }
  }
  parseExprList(close, allowEmpty, refExpressionErrors, nodeForExtra) {
    const elts = [];
    let first = true;
    while (!this.eat(close)) {
      if (first) {
        first = false;
      } else {
        this.expect(8);
        if (this.match(close)) {
          if (nodeForExtra) {
            this.addTrailingCommaExtraToNode(nodeForExtra);
          }
          this.next();
          break;
        }
      }
      elts.push(this.parseExprListItem(close, allowEmpty, refExpressionErrors));
    }
    return elts;
  }
  parseExprListItem(close, allowEmpty, refExpressionErrors, allowPlaceholder) {
    let elt;
    if (this.match(8)) {
      if (!allowEmpty) {
        this.raise(Errors.UnexpectedToken, this.state.curPosition(), {
          unexpected: ","
        });
      }
      elt = null;
    } else if (this.match(17)) {
      const spreadNodeStartLoc = this.state.startLoc;
      elt = this.parseParenItem(this.parseSpread(refExpressionErrors), spreadNodeStartLoc);
    } else if (this.match(13)) {
      this.expectPlugin("partialApplication");
      if (!allowPlaceholder) {
        this.raise(Errors.UnexpectedArgumentPlaceholder, this.state.startLoc);
      }
      const node = this.startNode();
      this.next();
      elt = this.finishNode(node, "ArgumentPlaceholder");
    } else {
      elt = this.parseMaybeAssignAllowInOrVoidPattern(close, refExpressionErrors, this.parseParenItem);
    }
    return elt;
  }
  parseIdentifier(liberal) {
    const node = this.startNode();
    const name = this.parseIdentifierName(liberal);
    return this.createIdentifier(node, name);
  }
  createIdentifier(node, name) {
    node.name = name;
    if (this.optionFlags & 256) {
      node.loc.identifierName = name;
    }
    return this.finishNode(node, "Identifier");
  }
  createIdentifierAt(node, name, endLoc) {
    node.name = name;
    if (this.optionFlags & 256) {
      node.loc.identifierName = name;
    }
    return this.finishNodeAt(node, "Identifier", endLoc);
  }
  parseIdentifierName(liberal) {
    let name;
    const {
      start,
      type
    } = this.state;
    if (tokenIsKeywordOrIdentifier(type)) {
      name = this.state.value;
    } else {
      this.unexpected();
    }
    const tokenIsKeyword2 = tokenKeywordOrIdentifierIsKeyword(type);
    if (liberal) {
      if (tokenIsKeyword2) {
        this.replaceToken(128);
      }
    } else {
      this.checkReservedWord(name, this.sourceToOffsetPos(start), tokenIsKeyword2, false);
    }
    this.next();
    return name;
  }
  checkReservedWord(word, startLoc, checkKeywords, isBinding) {
    if (word.length > 10) {
      return;
    }
    if (!canBeReservedWord(word)) {
      return;
    }
    if (checkKeywords && isKeyword(word)) {
      this.raise(Errors.UnexpectedKeyword, startLoc, {
        keyword: word
      });
      return;
    }
    const reservedTest = !this.state.strict ? isReservedWord : isBinding ? isStrictBindReservedWord : isStrictReservedWord;
    if (reservedTest(word, this.inModule)) {
      this.raise(Errors.UnexpectedReservedWord, startLoc, {
        reservedWord: word
      });
      return;
    } else if (word === "yield") {
      if (this.prodParam.hasYield) {
        this.raise(Errors.YieldBindingIdentifier, startLoc);
        return;
      }
    } else if (word === "await") {
      if (this.prodParam.hasAwait) {
        this.raise(Errors.AwaitBindingIdentifier, startLoc);
        return;
      }
      if (this.scope.inStaticBlock) {
        this.raise(Errors.AwaitBindingIdentifierInStaticBlock, startLoc);
        return;
      }
      this.expressionScope.recordAsyncArrowParametersError(startLoc);
    } else if (word === "arguments") {
      if (this.scope.inClassAndNotInNonArrowFunction) {
        this.raise(Errors.ArgumentsInClass, startLoc);
        return;
      }
    }
  }
  recordAwaitIfAllowed() {
    const isAwaitAllowed = this.prodParam.hasAwait;
    if (isAwaitAllowed && !this.scope.inFunction) {
      this.state.hasTopLevelAwait = true;
    }
    return isAwaitAllowed;
  }
  parseAwait(startLoc, soloAwait) {
    const startIndex = startLoc.index;
    this.setLoc(startLoc);
    const node = this.startNodeAt(startLoc);
    this.expressionScope.recordParameterInitializerError(Errors.AwaitExpressionFormalParameter, startIndex);
    if (this.eat(51)) {
      this.raise(Errors.ObsoleteAwaitStar, startLoc);
    }
    if (!this.scope.inFunction && !(this.optionFlags & 1)) {
      if (this.isAmbiguousPrefixOrIdentifier()) {
        this.ambiguousScriptDifferentAst = true;
      } else {
        this.sawUnambiguousESM = true;
      }
    }
    if (!soloAwait) {
      node.argument = this.parseMaybeUnary(null, true);
    }
    return this.finishNode(node, "AwaitExpression");
  }
  isAmbiguousPrefixOrIdentifier() {
    if (this.hasPrecedingLineBreak()) return true;
    const {
      type
    } = this.state;
    return type === 49 || type === 6 || type === 0 || tokenIsTemplate(type) || type === 98 && !this.state.containsEsc || type === 133 || type === 52 || this.hasPlugin("v8intrinsic") && type === 50;
  }
  parseYield(startLoc) {
    this.setLoc(startLoc);
    const node = this.startNodeAt(startLoc);
    this.expressionScope.recordParameterInitializerError(Errors.YieldInParameter, startLoc.index);
    let delegating = false;
    let argument = null;
    if (!this.hasPrecedingLineBreak()) {
      delegating = this.eat(51);
      switch (this.state.type) {
        case 9:
        case 135:
        case 4:
        case 7:
        case 1:
        case 5:
        case 10:
        case 8:
          if (!delegating) break;
        default:
          argument = this.parseMaybeAssign();
      }
    }
    node.delegate = delegating;
    node.argument = argument;
    return this.finishNode(node, "YieldExpression");
  }
  parseImportCall(node) {
    this.next();
    const args = this.parseCallExpressionArguments();
    if (args.length === 0 || args.length > 2) {
      this.raise(Errors.ImportCallArity, node, node);
    } else {
      for (const arg of args) {
        if (arg.type === "SpreadElement") {
          this.raise(Errors.ImportCallSpreadArgument, arg, node);
        }
      }
    }
    node.source = args[0];
    node.options = args[1] ?? null;
    return this.finishNode(node, "ImportExpression");
  }
  withTopicBindingContext(callback) {
    const oldInHackPipelineBody = this.state.inHackPipelineBody;
    this.state.inHackPipelineBody = true;
    const oldSeenTopicReference = this.state.seenTopicReference;
    this.state.seenTopicReference = false;
    try {
      return callback();
    } finally {
      this.state.inHackPipelineBody = oldInHackPipelineBody;
      this.state.seenTopicReference = oldSeenTopicReference;
    }
  }
  allowInAnd(callback) {
    const flags = this.prodParam.currentFlags();
    const prodParamToSet = (8 | 16) & ~flags;
    if (prodParamToSet) {
      this.prodParam.enter(flags | 8 | 16);
      try {
        return callback();
      } finally {
        this.prodParam.exit();
      }
    }
    return callback();
  }
  disallowInAnd(callback) {
    const flags = this.prodParam.currentFlags();
    const prodParamToClear = 8 & flags;
    const prodParamToSet = 16 & ~flags;
    if (prodParamToClear || prodParamToSet) {
      this.prodParam.enter(flags & -9 | 16);
      try {
        return callback();
      } finally {
        this.prodParam.exit();
      }
    }
    return callback();
  }
  registerTopicReference() {
    this.state.seenTopicReference = true;
  }
  topicReferenceIsAllowedInCurrentContext() {
    return this.state.inHackPipelineBody;
  }
  topicReferenceWasUsedInCurrentContext() {
    return this.state.seenTopicReference;
  }
  parseFSharpPipelineBody(prec) {
    const startLoc = this.state.startLoc;
    this.prodParam.enter(this.prodParam.currentFlags() & -17);
    let ret;
    if (this.isContextual(92) && this.recordAwaitIfAllowed()) {
      this.next();
      ret = this.parseAwait(startLoc, true);
      const nextOp = this.state.type;
      if (tokenIsOperator(nextOp) && nextOp !== 35 && (this.prodParam.hasIn || nextOp !== 54)) {
        this.raise(Errors.PipelineUnparenthesized, startLoc);
      }
    } else {
      this.state.canStartArrow = true;
      ret = this.parseExprOp(this.parseMaybeUnaryOrPrivate(), startLoc, prec);
    }
    this.prodParam.exit();
    return ret;
  }
  parseModuleExpression() {
    this.expectPlugin("moduleBlocks");
    const node = this.startNode();
    this.next();
    if (!this.match(2)) {
      this.unexpected(null, 2);
    }
    const program = this.startNodeAt(this.state.endLoc);
    this.next();
    const revertScopes = this.initializeScopes(true);
    this.enterInitialScopes();
    try {
      node.body = this.parseProgram(program, 4, "module");
    } finally {
      revertScopes();
    }
    return this.finishNode(node, "ModuleExpression");
  }
  parseVoidPattern(refExpressionErrors) {
    this.expectPlugin("discardBinding");
    const node = this.startNode();
    if (refExpressionErrors != null) {
      refExpressionErrors.voidPatternLoc = this.state.startLoc;
    }
    this.next();
    return this.finishNode(node, "VoidPattern");
  }
  parseMaybeAssignAllowInOrVoidPattern(close, refExpressionErrors, afterLeftParse) {
    if (refExpressionErrors != null && this.match(84)) {
      const nextCode = this.lookaheadCharCode();
      if (nextCode === 44 || nextCode === (close === 1 ? 93 : close === 4 ? 125 : 41) || nextCode === 61) {
        return this.parseMaybeDefault(this.state.startLoc, this.parseVoidPattern(refExpressionErrors));
      }
    }
    return this.parseMaybeAssignAllowIn(refExpressionErrors, afterLeftParse);
  }
  parsePropertyNamePrefixOperator(prop) {
  }
};
var loopLabel = {
  kind: 1
};
var switchLabel = {
  kind: 2
};
var loneSurrogate = /[\uD800-\uDFFF]/u;
var keywordRelationalOperator = /in(?:stanceof)?/y;
function createExportedTokens(tokens2) {
  for (let i = 0; i < tokens2.length; i++) {
    const token = tokens2[i];
    const {
      type
    } = token;
    if (typeof type === "number") {
      token.type = getExportedToken(type);
    }
  }
  return tokens2;
}
var StatementParser = class extends ExpressionParser {
  parseTopLevel(file, program) {
    file.program = this.parseProgram(program, 135, this.options.sourceType === "module" ? "module" : "script");
    file.comments = this.comments;
    if (this.optionFlags & 512) {
      file.tokens = createExportedTokens(this.tokens);
    }
    return this.finishNode(file, "File");
  }
  parseProgram(program, end, sourceType) {
    program.sourceType = sourceType;
    program.interpreter = this.parseInterpreterDirective();
    this.parseBlockBody(program, true, true, end);
    if (this.inModule) {
      if (!(this.optionFlags & 64) && this.scope.undefinedExports.size > 0) {
        for (const [localName, at] of Array.from(this.scope.undefinedExports)) {
          this.raise(Errors.ModuleExportUndefined, at, {
            localName
          });
        }
      }
      this.addExtra(program, "topLevelAwait", this.state.hasTopLevelAwait);
    }
    let finishedProgram;
    if (end === 135) {
      finishedProgram = this.finishNode(program, "Program");
    } else {
      finishedProgram = this.finishNodeAt(program, "Program", createPositionWithColumnOffset(this.state.startLoc, -1));
    }
    return finishedProgram;
  }
  stmtToDirective(stmt) {
    const directive = this.castNodeTo(stmt, "Directive");
    const directiveLiteral = this.castNodeTo(stmt.expression, "DirectiveLiteral");
    const expressionValue = directiveLiteral.value;
    const raw = this.input.slice(this.offsetToSourcePos(directiveLiteral.start), this.offsetToSourcePos(directiveLiteral.end));
    const val = directiveLiteral.value = raw.slice(1, -1);
    this.addExtra(directiveLiteral, "raw", raw);
    this.addExtra(directiveLiteral, "rawValue", val);
    this.addExtra(directiveLiteral, "expressionValue", expressionValue);
    directive.value = directiveLiteral;
    delete stmt.expression;
    return directive;
  }
  parseInterpreterDirective() {
    if (!this.match(24)) {
      return null;
    }
    const node = this.startNode();
    node.value = this.state.value;
    this.next();
    return this.finishNode(node, "InterpreterDirective");
  }
  isLet() {
    if (!this.isContextual(96)) {
      return false;
    }
    return this.hasFollowingBindingAtom();
  }
  isUsing() {
    if (!this.isContextual(103)) {
      return false;
    }
    return this.nextTokenIsIdentifierOnSameLine();
  }
  isForUsing() {
    if (!this.isContextual(103)) {
      return false;
    }
    const next = this.nextTokenInLineStart();
    const nextCh = this.codePointAtPos(next);
    if (this.isUnparsedContextual(next, "of")) {
      const nextCharAfterOf = this.lookaheadCharCodeSince(next + 2);
      if (nextCharAfterOf !== 61 && nextCharAfterOf !== 58 && nextCharAfterOf !== 59) {
        return false;
      }
    }
    if (this.chStartsBindingIdentifier(nextCh, next) || this.isUnparsedContextual(next, "void")) {
      return true;
    }
    return false;
  }
  nextTokenIsIdentifierOnSameLine() {
    const next = this.nextTokenInLineStart();
    const nextCh = this.codePointAtPos(next);
    return this.chStartsBindingIdentifier(nextCh, next);
  }
  isAwaitUsing() {
    if (!this.isContextual(92)) {
      return false;
    }
    let next = this.nextTokenInLineStart();
    if (this.isUnparsedContextual(next, "using")) {
      next = this.nextTokenInLineStartSince(next + 5);
      const nextCh = this.codePointAtPos(next);
      if (this.chStartsBindingIdentifier(nextCh, next)) {
        return true;
      }
    }
    return false;
  }
  chStartsBindingIdentifier(ch, pos) {
    if (isIdentifierStart(ch)) {
      keywordRelationalOperator.lastIndex = pos;
      if (keywordRelationalOperator.test(this.input)) {
        const endCh = this.codePointAtPos(keywordRelationalOperator.lastIndex);
        if (!isIdentifierChar(endCh) && endCh !== 92) {
          return false;
        }
      }
      return true;
    } else if (ch === 92) {
      return true;
    } else {
      return false;
    }
  }
  chStartsBindingPattern(ch) {
    return ch === 91 || ch === 123;
  }
  hasFollowingBindingAtom() {
    const next = this.nextTokenStart();
    const nextCh = this.codePointAtPos(next);
    return this.chStartsBindingPattern(nextCh) || this.chStartsBindingIdentifier(nextCh, next);
  }
  hasInLineFollowingBindingIdentifierOrBrace() {
    const next = this.nextTokenInLineStart();
    const nextCh = this.codePointAtPos(next);
    return nextCh === 123 || this.chStartsBindingIdentifier(nextCh, next);
  }
  allowsUsing() {
    return (this.scope.inModule || !this.scope.inTopLevel) && !this.scope.inBareCaseStatement;
  }
  parseModuleItem() {
    return this.parseStatementLike(1 | 2 | 4 | 8);
  }
  parseStatementListItem() {
    return this.parseStatementLike(2 | 4 | (!this.options.annexB || this.state.strict ? 0 : 8));
  }
  parseStatementOrSloppyAnnexBFunctionDeclaration(allowLabeledFunction = false) {
    let flags = 0;
    if (this.options.annexB && !this.state.strict) {
      flags |= 4;
      if (allowLabeledFunction) {
        flags |= 8;
      }
    }
    return this.parseStatementLike(flags);
  }
  parseStatement() {
    return this.parseStatementLike(0);
  }
  parseStatementLike(flags) {
    let decorators = null;
    if (this.match(22)) {
      decorators = this.parseDecorators(true);
    }
    return this.parseStatementContent(flags, decorators);
  }
  parseStatementContent(flags, decorators) {
    const startType = this.state.type;
    const node = this.startNode();
    const allowDeclaration = !!(flags & 2);
    const allowFunctionDeclaration = !!(flags & 4);
    const topLevel = flags & 1;
    switch (startType) {
      case 56:
        return this.parseBreakContinueStatement(node, true);
      case 59:
        return this.parseBreakContinueStatement(node, false);
      case 60:
        return this.parseDebuggerStatement(node);
      case 86:
        return this.parseDoWhileStatement(node);
      case 87:
        return this.parseForStatement(node);
      case 64:
        if (this.lookaheadCharCode() === 46) break;
        if (!allowFunctionDeclaration) {
          this.raise(this.state.strict ? Errors.StrictFunction : this.options.annexB ? Errors.SloppyFunctionAnnexB : Errors.SloppyFunction, this.state.startLoc);
        }
        return this.parseFunctionStatement(node, false, !allowDeclaration && allowFunctionDeclaration);
      case 76:
        if (!allowDeclaration) this.unexpected();
        return this.parseClass(this.maybeTakeDecorators(decorators, node), true);
      case 65:
        return this.parseIfStatement(node);
      case 66:
        return this.parseReturnStatement(node);
      case 67:
        return this.parseSwitchStatement(node);
      case 68:
        return this.parseThrowStatement(node);
      case 69:
        return this.parseTryStatement(node);
      case 92:
        if (this.isAwaitUsing()) {
          if (!this.allowsUsing()) {
            this.raise(Errors.UnexpectedUsingDeclaration, node);
          } else if (!allowDeclaration) {
            this.raise(Errors.UnexpectedLexicalDeclaration, node);
          } else if (!this.recordAwaitIfAllowed()) {
            this.raise(Errors.AwaitUsingNotInAsyncContext, node);
          }
          this.next();
          return this.parseVarStatement(node, "await using");
        }
        break;
      case 103:
        if (this.state.containsEsc || !this.hasInLineFollowingBindingIdentifierOrBrace()) {
          break;
        }
        if (!this.allowsUsing()) {
          this.raise(Errors.UnexpectedUsingDeclaration, this.state.startLoc);
        } else if (!allowDeclaration) {
          this.raise(Errors.UnexpectedLexicalDeclaration, this.state.startLoc);
        }
        return this.parseVarStatement(node, "using");
      case 96: {
        if (this.state.containsEsc) {
          break;
        }
        const next = this.nextTokenStart();
        const nextCh = this.codePointAtPos(next);
        if (nextCh !== 91) {
          if (!allowDeclaration && this.hasFollowingLineBreak()) break;
          if (!this.chStartsBindingIdentifier(nextCh, next) && nextCh !== 123) {
            break;
          }
        }
      }
      case 71: {
        if (!allowDeclaration) {
          this.raise(Errors.UnexpectedLexicalDeclaration, this.state.startLoc);
        }
      }
      case 70: {
        const kind = this.state.value;
        return this.parseVarStatement(node, kind);
      }
      case 88:
        return this.parseWhileStatement(node);
      case 72:
        return this.parseWithStatement(node);
      case 2:
        return this.parseBlock();
      case 9:
        return this.parseEmptyStatement(node);
      case 79: {
        const nextTokenCharCode = this.lookaheadCharCode();
        if (nextTokenCharCode === 40 || nextTokenCharCode === 46) {
          break;
        }
      }
      case 78: {
        if (!(this.optionFlags & 8) && !topLevel) {
          this.raise(Errors.UnexpectedImportExport, this.state.startLoc);
        }
        this.next();
        let result;
        if (startType === 79) {
          result = this.parseImport(node);
        } else {
          result = this.parseExport(node, decorators);
        }
        this.assertModuleNodeAllowed(result);
        return result;
      }
      default: {
        if (this.isAsyncFunction()) {
          if (!allowDeclaration) {
            this.raise(Errors.AsyncFunctionInSingleStatementContext, this.state.startLoc);
          }
          this.next();
          return this.parseFunctionStatement(node, true, !allowDeclaration && allowFunctionDeclaration);
        }
      }
    }
    const maybeName = this.state.value;
    const expr = this.parseExpression();
    if (tokenIsIdentifier(startType) && expr.type === "Identifier" && this.eat(10)) {
      return this.parseLabeledStatement(node, maybeName, expr, flags);
    } else {
      return this.parseExpressionStatement(node, expr, decorators);
    }
  }
  assertModuleNodeAllowed(node) {
    if (!(this.optionFlags & 8) && !this.inModule) {
      this.raise(Errors.ImportOutsideModule, node);
    }
  }
  maybeTakeDecorators(maybeDecorators, classNode, exportNode) {
    if (maybeDecorators) {
      if (classNode.decorators?.length) {
        this.raise(Errors.DecoratorsBeforeAfterExport, classNode.decorators[0]);
        classNode.decorators.unshift(...maybeDecorators);
      } else {
        classNode.decorators = maybeDecorators;
      }
      this.resetStartLocationFromNode(classNode, maybeDecorators[0]);
      if (exportNode) this.resetStartLocationFromNode(exportNode, classNode);
    }
    return classNode;
  }
  canHaveLeadingDecorator() {
    return this.match(76);
  }
  parseDecorators(allowExport) {
    const decorators = [];
    do {
      decorators.push(this.parseDecorator());
    } while (this.match(22));
    if (this.match(78)) {
      if (!allowExport) {
        this.unexpected();
      }
    } else if (!this.canHaveLeadingDecorator()) {
      throw this.raise(Errors.UnexpectedLeadingDecorator, this.state.startLoc);
    }
    return decorators;
  }
  parseDecorator() {
    this.expectOnePlugin(["decorators", "decorators-legacy"]);
    const node = this.startNode();
    this.next();
    if (this.hasPlugin("decorators")) {
      const startLoc = this.state.startLoc;
      let expr;
      if (this.match(6)) {
        const startLoc2 = this.state.startLoc;
        this.next();
        expr = this.parseExpression();
        this.expect(7);
        expr = this.wrapParenthesis(startLoc2, expr);
        const paramsStartLoc = this.state.startLoc;
        node.expression = this.parseMaybeDecoratorArguments(expr, startLoc2);
        if (node.expression !== expr) {
          this.raise(Errors.DecoratorArgumentsOutsideParentheses, paramsStartLoc);
        }
      } else {
        expr = this.parseIdentifier(false);
        while (this.eat(12)) {
          const node2 = this.startNodeAt(startLoc);
          node2.object = expr;
          if (this.match(134)) {
            this.classScope.usePrivateName(this.state.value, this.state.startLoc);
            node2.property = this.parsePrivateName();
          } else {
            node2.property = this.parseIdentifier(true);
          }
          node2.computed = false;
          expr = this.finishNode(node2, "MemberExpression");
        }
        node.expression = this.parseMaybeDecoratorArguments(expr, startLoc);
      }
    } else {
      this.state.canStartArrow = false;
      node.expression = this.parseExprSubscripts();
    }
    return this.finishNode(node, "Decorator");
  }
  parseMaybeDecoratorArguments(expr, startLoc) {
    if (this.eat(6)) {
      const node = this.startNodeAt(startLoc);
      node.callee = expr;
      node.arguments = this.parseCallExpressionArguments();
      this.toReferencedList(node.arguments);
      return this.finishNode(node, "CallExpression");
    }
    return expr;
  }
  parseBreakContinueStatement(node, isBreak) {
    this.next();
    if (this.isLineTerminator()) {
      node.label = null;
    } else {
      node.label = this.parseIdentifier();
      this.semicolon();
    }
    this.verifyBreakContinue(node, isBreak);
    return this.finishNode(node, isBreak ? "BreakStatement" : "ContinueStatement");
  }
  verifyBreakContinue(node, isBreak) {
    let i;
    for (i = 0; i < this.state.labels.length; ++i) {
      const lab = this.state.labels[i];
      if (node.label == null || lab.name === node.label.name) {
        if (lab.kind != null && (isBreak || lab.kind === 1)) {
          break;
        }
        if (node.label && isBreak) break;
      }
    }
    if (i === this.state.labels.length) {
      const type = isBreak ? "BreakStatement" : "ContinueStatement";
      this.raise(Errors.IllegalBreakContinue, node, {
        type
      });
    }
  }
  parseDebuggerStatement(node) {
    this.next();
    this.semicolon();
    return this.finishNode(node, "DebuggerStatement");
  }
  parseHeaderExpression() {
    this.expect(6);
    const val = this.parseExpression();
    this.expect(7);
    return val;
  }
  parseDoWhileStatement(node) {
    this.next();
    this.state.labels.push(loopLabel);
    node.body = this.parseStatement();
    this.state.labels.pop();
    this.expect(88);
    node.test = this.parseHeaderExpression();
    this.eat(9);
    return this.finishNode(node, "DoWhileStatement");
  }
  parseForStatement(node) {
    this.next();
    this.state.labels.push(loopLabel);
    let awaitAt = null;
    if (this.isContextual(92) && this.recordAwaitIfAllowed()) {
      awaitAt = this.state.startLoc;
      this.next();
    }
    this.scope.enter(0);
    this.expect(6);
    if (this.match(9)) {
      if (awaitAt !== null) {
        this.unexpected(awaitAt);
      }
      return this.parseFor(node, null);
    }
    const startsWithLet = this.isContextual(96);
    {
      const startsWithAwaitUsing = this.isAwaitUsing();
      const starsWithUsingDeclaration = startsWithAwaitUsing || this.isForUsing();
      const isLetOrUsing = startsWithLet && this.hasFollowingBindingAtom() || starsWithUsingDeclaration;
      if (this.match(70) || this.match(71) || isLetOrUsing) {
        const initNode = this.startNode();
        let kind;
        if (startsWithAwaitUsing) {
          kind = "await using";
          if (!this.recordAwaitIfAllowed()) {
            this.raise(Errors.AwaitUsingNotInAsyncContext, this.state.startLoc);
          }
          this.next();
        } else {
          kind = this.state.value;
        }
        this.next();
        this.parseVar(initNode, true, kind);
        const init2 = this.finishNode(initNode, "VariableDeclaration");
        const isForIn = this.match(54);
        if (isForIn && starsWithUsingDeclaration) {
          this.raise(Errors.ForInUsing, init2);
        }
        if ((isForIn || this.isContextual(98)) && init2.declarations.length === 1) {
          return this.parseForIn(node, init2, awaitAt);
        }
        if (awaitAt !== null) {
          this.unexpected(awaitAt);
        }
        return this.parseFor(node, init2);
      }
    }
    const startsWithAsync = this.isContextual(91);
    const refExpressionErrors = new ExpressionErrors();
    const init = this.parseExpression(true, refExpressionErrors);
    const isForOf = this.isContextual(98);
    if (isForOf) {
      if (startsWithLet) {
        this.raise(Errors.ForOfLet, init);
      }
      if (awaitAt === null && startsWithAsync && init.type === "Identifier") {
        this.raise(Errors.ForOfAsync, init);
      }
    }
    if (isForOf || this.match(54)) {
      this.checkDestructuringPrivate(refExpressionErrors);
      this.toAssignable(init, true);
      const type = isForOf ? "ForOfStatement" : "ForInStatement";
      this.checkLVal(init, {
        type
      });
      return this.parseForIn(node, init, awaitAt);
    } else {
      this.checkExpressionErrors(refExpressionErrors, true);
    }
    if (awaitAt !== null) {
      this.unexpected(awaitAt);
    }
    return this.parseFor(node, init);
  }
  parseFunctionStatement(node, isAsync, isHangingDeclaration) {
    this.next();
    return this.parseFunction(node, 1 | (isHangingDeclaration ? 2 : 0) | (isAsync ? 8 : 0));
  }
  parseIfStatement(node) {
    this.next();
    node.test = this.parseHeaderExpression();
    node.consequent = this.parseStatementOrSloppyAnnexBFunctionDeclaration();
    node.alternate = this.eat(62) ? this.parseStatementOrSloppyAnnexBFunctionDeclaration() : null;
    return this.finishNode(node, "IfStatement");
  }
  parseReturnStatement(node) {
    if (!this.prodParam.hasReturn) {
      this.raise(Errors.IllegalReturn, this.state.startLoc);
    }
    this.next();
    if (this.isLineTerminator()) {
      node.argument = null;
    } else {
      node.argument = this.parseExpression();
      this.semicolon();
    }
    return this.finishNode(node, "ReturnStatement");
  }
  parseSwitchStatement(node) {
    this.next();
    node.discriminant = this.parseHeaderExpression();
    const cases = node.cases = [];
    this.expect(2);
    this.state.labels.push(switchLabel);
    this.scope.enter(256);
    let cur;
    for (let sawDefault; !this.match(4); ) {
      if (this.match(57) || this.match(61)) {
        const isCase = this.match(57);
        if (cur) this.finishNode(cur, "SwitchCase");
        cases.push(cur = this.startNode());
        cur.consequent = [];
        this.next();
        if (isCase) {
          cur.test = this.parseExpression();
        } else {
          if (sawDefault) {
            this.raise(Errors.MultipleDefaultsInSwitch, this.state.lastTokStartLoc);
          }
          sawDefault = true;
          cur.test = null;
        }
        this.expect(10);
      } else {
        if (cur) {
          cur.consequent.push(this.parseStatementListItem());
        } else {
          this.unexpected();
        }
      }
    }
    this.scope.exit();
    if (cur) this.finishNode(cur, "SwitchCase");
    this.next();
    this.state.labels.pop();
    return this.finishNode(node, "SwitchStatement");
  }
  parseThrowStatement(node) {
    this.next();
    if (this.hasPrecedingLineBreak()) {
      this.raise(Errors.NewlineAfterThrow, this.state.lastTokEndLoc);
    }
    node.argument = this.parseExpression();
    this.semicolon();
    return this.finishNode(node, "ThrowStatement");
  }
  parseCatchClauseParam() {
    const param = this.parseBindingAtom();
    this.scope.enter(this.options.annexB && param.type === "Identifier" ? 8 : 0);
    this.checkLVal(param, {
      type: "CatchClause"
    }, 9);
    return param;
  }
  parseTryStatement(node) {
    this.next();
    node.block = this.parseBlock();
    node.handler = null;
    if (this.match(58)) {
      const clause = this.startNode();
      this.next();
      if (this.match(6)) {
        this.expect(6);
        clause.param = this.parseCatchClauseParam();
        this.expect(7);
      } else {
        clause.param = null;
        this.scope.enter(0);
      }
      clause.body = this.parseBlock(false, false);
      this.scope.exit();
      node.handler = this.finishNode(clause, "CatchClause");
    }
    node.finalizer = this.eat(63) ? this.parseBlock() : null;
    if (!node.handler && !node.finalizer) {
      this.raise(Errors.NoCatchOrFinally, node);
    }
    return this.finishNode(node, "TryStatement");
  }
  parseVarStatement(node, kind, allowMissingInitializer = false) {
    this.next();
    this.parseVar(node, false, kind, allowMissingInitializer);
    this.semicolon();
    return this.finishNode(node, "VariableDeclaration");
  }
  parseWhileStatement(node) {
    this.next();
    node.test = this.parseHeaderExpression();
    this.state.labels.push(loopLabel);
    node.body = this.parseStatement();
    this.state.labels.pop();
    return this.finishNode(node, "WhileStatement");
  }
  parseWithStatement(node) {
    if (this.state.strict) {
      this.raise(Errors.StrictWith, this.state.startLoc);
    }
    this.next();
    node.object = this.parseHeaderExpression();
    node.body = this.parseStatement();
    return this.finishNode(node, "WithStatement");
  }
  parseEmptyStatement(node) {
    this.next();
    return this.finishNode(node, "EmptyStatement");
  }
  parseLabeledStatement(node, maybeName, expr, flags) {
    for (const label of this.state.labels) {
      if (label.name === maybeName) {
        this.raise(Errors.LabelRedeclaration, expr, {
          labelName: maybeName
        });
      }
    }
    const kind = tokenIsLoop(this.state.type) ? 1 : this.match(67) ? 2 : null;
    for (let i = this.state.labels.length - 1; i >= 0; i--) {
      const label = this.state.labels[i];
      if (label.statementStart === node.start) {
        label.statementStart = this.sourceToOffsetPos(this.state.start);
        label.kind = kind;
      } else {
        break;
      }
    }
    this.state.labels.push({
      name: maybeName,
      kind,
      statementStart: this.sourceToOffsetPos(this.state.start)
    });
    node.body = flags & 8 ? this.parseStatementOrSloppyAnnexBFunctionDeclaration(true) : this.parseStatement();
    this.state.labels.pop();
    node.label = expr;
    return this.finishNode(node, "LabeledStatement");
  }
  parseExpressionStatement(node, expr, decorators) {
    node.expression = expr;
    this.semicolon();
    return this.finishNode(node, "ExpressionStatement");
  }
  parseBlock(allowDirectives = false, createNewLexicalScope = true, afterBlockParse) {
    const node = this.startNode();
    if (allowDirectives) {
      this.state.strictErrors.clear();
    }
    this.expect(2);
    if (createNewLexicalScope) {
      this.scope.enter(0);
    }
    this.parseBlockBody(node, allowDirectives, false, 4, afterBlockParse);
    if (createNewLexicalScope) {
      this.scope.exit();
    }
    return this.finishNode(node, "BlockStatement");
  }
  isValidDirective(stmt) {
    return stmt.type === "ExpressionStatement" && stmt.expression.type === "StringLiteral" && !stmt.expression.extra.parenthesized;
  }
  parseBlockBody(node, allowDirectives, topLevel, end, afterBlockParse) {
    const body = node.body = [];
    const directives = node.directives = [];
    this.parseBlockOrModuleBlockBody(body, allowDirectives ? directives : void 0, topLevel, end, afterBlockParse);
  }
  parseBlockOrModuleBlockBody(body, directives, topLevel, end, afterBlockParse) {
    const oldStrict = this.state.strict;
    let hasStrictModeDirective = false;
    let parsedNonDirective = false;
    while (!this.match(end)) {
      const stmt = topLevel ? this.parseModuleItem() : this.parseStatementListItem();
      if (directives && !parsedNonDirective) {
        if (this.isValidDirective(stmt)) {
          const directive = this.stmtToDirective(stmt);
          directives.push(directive);
          if (!hasStrictModeDirective && directive.value.value === "use strict") {
            hasStrictModeDirective = true;
            this.setStrict(true);
          }
          continue;
        }
        parsedNonDirective = true;
        this.state.strictErrors.clear();
      }
      body.push(stmt);
    }
    afterBlockParse?.call(this, hasStrictModeDirective);
    if (!oldStrict) {
      this.setStrict(false);
    }
    this.next();
  }
  parseFor(node, init) {
    node.init = init;
    this.semicolon(false);
    node.test = this.match(9) ? null : this.parseExpression();
    this.semicolon(false);
    node.update = this.match(7) ? null : this.parseExpression();
    this.expect(7);
    node.body = this.parseStatement();
    this.scope.exit();
    this.state.labels.pop();
    return this.finishNode(node, "ForStatement");
  }
  parseForIn(node, init, awaitAt) {
    const isForIn = this.match(54);
    this.next();
    if (isForIn) {
      if (awaitAt !== null) this.unexpected(awaitAt);
    } else {
      node.await = awaitAt !== null;
    }
    if (init.type === "VariableDeclaration" && init.declarations[0].init != null && (!isForIn || !this.options.annexB || this.state.strict || init.kind !== "var" || init.declarations[0].id.type !== "Identifier")) {
      this.raise(Errors.ForInOfLoopInitializer, init, {
        type: isForIn ? "ForInStatement" : "ForOfStatement"
      });
    }
    if (init.type === "AssignmentPattern") {
      this.raise(Errors.InvalidLhs, init, {
        ancestor: {
          type: "ForStatement"
        }
      });
    }
    node.left = init;
    node.right = isForIn ? this.parseExpression() : this.parseMaybeAssignAllowIn();
    this.expect(7);
    node.body = this.parseStatement();
    this.scope.exit();
    this.state.labels.pop();
    return this.finishNode(node, isForIn ? "ForInStatement" : "ForOfStatement");
  }
  parseVar(node, isFor, kind, allowMissingInitializer = false) {
    const declarations2 = node.declarations = [];
    node.kind = kind;
    for (; ; ) {
      const decl = this.startNode();
      this.parseVarId(decl, kind);
      decl.init = !this.eat(25) ? null : isFor ? this.parseMaybeAssignDisallowIn() : this.parseMaybeAssignAllowIn();
      if (decl.init === null && !allowMissingInitializer) {
        if (decl.id.type !== "Identifier" && !(isFor && (this.match(54) || this.isContextual(98)))) {
          this.raise(Errors.DeclarationMissingInitializer, this.state.lastTokEndLoc, {
            kind: "destructuring"
          });
        } else if ((kind === "const" || kind === "using" || kind === "await using") && !(this.match(54) || this.isContextual(98))) {
          this.raise(Errors.DeclarationMissingInitializer, this.state.lastTokEndLoc, {
            kind
          });
        }
      }
      declarations2.push(this.finishNode(decl, "VariableDeclarator"));
      if (!this.eat(8)) break;
    }
    return node;
  }
  parseVarId(decl, kind) {
    const id = this.parseBindingAtom();
    if (kind === "using" || kind === "await using") {
      if (id.type === "ArrayPattern" || id.type === "ObjectPattern") {
        this.raise(Errors.UsingDeclarationHasBindingPattern, id);
      }
    } else {
      if (id.type === "VoidPattern") {
        this.raise(Errors.UnexpectedVoidPattern, id);
      }
    }
    this.checkLVal(id, {
      type: "VariableDeclarator"
    }, kind === "var" ? 5 : 8201);
    decl.id = id;
  }
  parseAsyncFunctionExpression(node) {
    return this.parseFunction(node, 8);
  }
  parseFunction(node, flags = 0) {
    const hangingDeclaration = flags & 2;
    const isDeclaration = !!(flags & 1);
    const requireId = isDeclaration && !(flags & 4);
    const isAsync = !!(flags & 8);
    this.initFunction(node, isAsync);
    if (this.match(51)) {
      if (hangingDeclaration) {
        this.raise(Errors.GeneratorInSingleStatementContext, this.state.startLoc);
      }
      this.next();
      node.generator = true;
    }
    if (isDeclaration) {
      node.id = this.parseFunctionId(requireId);
    }
    this.scope.enter(514);
    this.prodParam.enter(functionFlags(isAsync, node.generator));
    if (!isDeclaration) {
      node.id = this.parseFunctionId();
    }
    this.parseFunctionParams(node, false);
    this.parseFunctionBodyAndFinish(node, isDeclaration ? "FunctionDeclaration" : "FunctionExpression");
    this.prodParam.exit();
    this.scope.exit();
    if (isDeclaration && !hangingDeclaration) {
      this.registerFunctionStatementId(node);
    }
    return node;
  }
  parseFunctionId(requireId) {
    return requireId || tokenIsIdentifier(this.state.type) ? this.parseIdentifier() : null;
  }
  parseFunctionParams(node, isConstructor) {
    this.expect(6);
    this.expressionScope.enter(newParameterDeclarationScope());
    node.params = this.parseBindingList(7, 41, 2 | (isConstructor ? 4 : 0));
    this.expressionScope.exit();
  }
  registerFunctionStatementId(node) {
    if (!node.id) return;
    this.scope.declareName(node.id.name, !this.options.annexB || this.state.strict || node.generator || node.async ? this.scope.treatFunctionsAsVar ? 5 : 8201 : 17, node.id.start);
  }
  parseClass(node, isStatement, optionalId) {
    this.next();
    const oldStrict = this.state.strict;
    this.state.strict = true;
    this.parseClassId(node, isStatement, optionalId);
    this.parseClassSuper(node);
    node.body = this.parseClassBody(!!node.superClass, oldStrict);
    return this.finishNode(node, isStatement ? "ClassDeclaration" : "ClassExpression");
  }
  isClassProperty() {
    return this.match(25) || this.match(9) || this.match(4);
  }
  isClassMethod() {
    return this.match(6);
  }
  nameIsConstructor(key) {
    return key.type === "Identifier" && key.name === "constructor" || key.type === "StringLiteral" && key.value === "constructor";
  }
  isNonstaticConstructor(method) {
    return !method.computed && !method.static && this.nameIsConstructor(method.key);
  }
  parseClassBody(hadSuperClass, oldStrict) {
    this.classScope.enter();
    const state = {
      hadConstructor: false,
      hadSuperClass
    };
    let decorators = [];
    const classBody = this.startNode();
    classBody.body = [];
    this.expect(2);
    while (!this.match(4)) {
      if (this.eat(9)) {
        if (decorators.length > 0) {
          throw this.raise(Errors.DecoratorSemicolon, this.state.lastTokEndLoc);
        }
        continue;
      }
      if (this.match(22)) {
        decorators.push(this.parseDecorator());
        continue;
      }
      const member = this.startNode();
      if (decorators.length) {
        member.decorators = decorators;
        this.resetStartLocationFromNode(member, decorators[0]);
        decorators = [];
      }
      this.parseClassMember(classBody, member, state);
    }
    this.state.strict = oldStrict;
    this.next();
    if (decorators.length) {
      throw this.raise(Errors.TrailingDecorator, this.state.startLoc);
    }
    this.classScope.exit();
    return this.finishNode(classBody, "ClassBody");
  }
  parseClassMemberFromModifier(classBody, member) {
    const key = this.parseIdentifier(true);
    if (this.isClassMethod()) {
      const method = member;
      method.kind = "method";
      method.computed = false;
      method.key = key;
      method.static = false;
      this.pushClassMethod(classBody, method, false, false, false, false);
      return true;
    } else if (this.isClassProperty()) {
      const prop = member;
      prop.computed = false;
      prop.key = key;
      prop.static = false;
      classBody.body.push(this.parseClassProperty(prop));
      return true;
    }
    this.resetPreviousNodeTrailingComments(key);
    return false;
  }
  parseClassMember(classBody, member, state) {
    const isStatic = this.isContextual(102);
    if (isStatic) {
      if (this.parseClassMemberFromModifier(classBody, member)) {
        return;
      }
      if (this.eat(2)) {
        this.parseClassStaticBlock(classBody, member);
        return;
      }
    }
    this.parseClassMemberWithIsStatic(classBody, member, state, isStatic);
  }
  parseClassMemberWithIsStatic(classBody, member, state, isStatic) {
    const publicMethod = member;
    const privateMethod = member;
    const publicProp = member;
    const privateProp = member;
    const accessorProp = member;
    const method = publicMethod;
    const publicMember = publicMethod;
    member.static = isStatic;
    this.parsePropertyNamePrefixOperator(member);
    if (this.eat(51)) {
      method.kind = "method";
      const isPrivateName = this.match(134);
      this.parseClassElementName(method);
      this.parsePostMemberNameModifiers(method);
      if (isPrivateName) {
        this.pushClassPrivateMethod(classBody, privateMethod, true, false);
        return;
      }
      if (this.isNonstaticConstructor(publicMethod)) {
        this.raise(Errors.ConstructorIsGenerator, publicMethod.key);
      }
      this.pushClassMethod(classBody, publicMethod, true, false, false, false);
      return;
    }
    const isContextual = !this.state.containsEsc && tokenIsIdentifier(this.state.type);
    const key = this.parseClassElementName(member);
    const maybeContextualKw = isContextual ? key.name : null;
    const isPrivate = this.isPrivateName(key);
    const maybeQuestionTokenStartLoc = this.state.startLoc;
    this.parsePostMemberNameModifiers(publicMember);
    if (this.isClassMethod()) {
      method.kind = "method";
      if (isPrivate) {
        this.pushClassPrivateMethod(classBody, privateMethod, false, false);
        return;
      }
      const isConstructor = this.isNonstaticConstructor(publicMethod);
      let allowsDirectSuper = false;
      if (isConstructor) {
        publicMethod.kind = "constructor";
        if (publicMethod.decorators && publicMethod.decorators.length > 0) {
          this.raise(Errors.DecoratorConstructor, member);
        }
        if (state.hadConstructor && !this.hasPlugin("typescript")) {
          this.raise(Errors.DuplicateConstructor, key);
        }
        if (isConstructor && this.hasPlugin("typescript") && member.override) {
          this.raise(Errors.OverrideOnConstructor, key);
        }
        state.hadConstructor = true;
        allowsDirectSuper = state.hadSuperClass;
      }
      this.pushClassMethod(classBody, publicMethod, false, false, isConstructor, allowsDirectSuper);
    } else if (this.isClassProperty()) {
      if (isPrivate) {
        this.pushClassPrivateProperty(classBody, privateProp);
      } else {
        this.pushClassProperty(classBody, publicProp);
      }
    } else if (maybeContextualKw === "async" && !this.isLineTerminator()) {
      this.resetPreviousNodeTrailingComments(key);
      const isGenerator = this.eat(51);
      if (publicMember.optional) {
        this.unexpected(maybeQuestionTokenStartLoc);
      }
      method.kind = "method";
      const isPrivate2 = this.match(134);
      this.parseClassElementName(method);
      this.parsePostMemberNameModifiers(publicMember);
      if (isPrivate2) {
        this.pushClassPrivateMethod(classBody, privateMethod, isGenerator, true);
      } else {
        if (this.isNonstaticConstructor(publicMethod)) {
          this.raise(Errors.ConstructorIsAsync, publicMethod.key);
        }
        this.pushClassMethod(classBody, publicMethod, isGenerator, true, false, false);
      }
    } else if ((maybeContextualKw === "get" || maybeContextualKw === "set") && !(this.match(51) && this.isLineTerminator())) {
      this.resetPreviousNodeTrailingComments(key);
      method.kind = maybeContextualKw;
      const isPrivate2 = this.match(134);
      this.parseClassElementName(publicMethod);
      if (isPrivate2) {
        this.pushClassPrivateMethod(classBody, privateMethod, false, false);
      } else {
        if (this.isNonstaticConstructor(publicMethod)) {
          this.raise(Errors.ConstructorIsAccessor, publicMethod.key);
        }
        this.pushClassMethod(classBody, publicMethod, false, false, false, false);
      }
      this.checkGetterSetterParams(publicMethod);
    } else if (maybeContextualKw === "accessor" && !this.isLineTerminator()) {
      this.expectPlugin("decoratorAutoAccessors");
      this.resetPreviousNodeTrailingComments(key);
      const isPrivate2 = this.match(134);
      this.parseClassElementName(publicProp);
      this.pushClassAccessorProperty(classBody, accessorProp, isPrivate2);
    } else if (this.isLineTerminator()) {
      if (isPrivate) {
        this.pushClassPrivateProperty(classBody, privateProp);
      } else {
        this.pushClassProperty(classBody, publicProp);
      }
    } else {
      this.unexpected();
    }
  }
  parseClassElementName(member) {
    const {
      type,
      value
    } = this.state;
    if ((type === 128 || type === 130) && member.static && value === "prototype") {
      this.raise(Errors.StaticPrototype, this.state.startLoc);
    }
    if (type === 134) {
      if (value === "constructor") {
        this.raise(Errors.ConstructorClassPrivateField, this.state.startLoc);
      }
      const key = this.parsePrivateName();
      member.key = key;
      return key;
    }
    this.parsePropertyName(member);
    return member.key;
  }
  parseClassStaticBlock(classBody, member) {
    this.scope.enter(576 | 128 | 16);
    const oldLabels = this.state.labels;
    this.state.labels = [];
    this.prodParam.enter(0);
    const body = member.body = [];
    this.parseBlockOrModuleBlockBody(body, void 0, false, 4);
    this.prodParam.exit();
    this.scope.exit();
    this.state.labels = oldLabels;
    classBody.body.push(this.finishNode(member, "StaticBlock"));
    if (member.decorators?.length) {
      this.raise(Errors.DecoratorStaticBlock, member);
    }
  }
  pushClassProperty(classBody, prop) {
    if (!prop.computed && this.nameIsConstructor(prop.key)) {
      this.raise(Errors.ConstructorClassField, prop.key);
    }
    classBody.body.push(this.parseClassProperty(prop));
  }
  pushClassPrivateProperty(classBody, prop) {
    const node = this.parseClassPrivateProperty(prop);
    classBody.body.push(node);
    this.classScope.declarePrivateName(this.getPrivateNameSV(node.key), 0, node.key.start);
  }
  pushClassAccessorProperty(classBody, prop, isPrivate) {
    if (!isPrivate && !prop.computed && this.nameIsConstructor(prop.key)) {
      this.raise(Errors.ConstructorClassField, prop.key);
    }
    const node = this.parseClassAccessorProperty(prop);
    classBody.body.push(node);
    if (isPrivate) {
      this.classScope.declarePrivateName(this.getPrivateNameSV(node.key), 0, node.key.start);
    }
  }
  pushClassMethod(classBody, method, isGenerator, isAsync, isConstructor, allowsDirectSuper) {
    classBody.body.push(this.parseMethod(method, isGenerator, isAsync, isConstructor, allowsDirectSuper, "ClassMethod", true));
  }
  pushClassPrivateMethod(classBody, method, isGenerator, isAsync) {
    const node = this.parseMethod(method, isGenerator, isAsync, false, false, "ClassPrivateMethod", true);
    classBody.body.push(node);
    const kind = node.kind === "get" ? node.static ? 6 : 2 : node.kind === "set" ? node.static ? 5 : 1 : 0;
    this.declareClassPrivateMethodInScope(node, kind);
  }
  declareClassPrivateMethodInScope(node, kind) {
    this.classScope.declarePrivateName(this.getPrivateNameSV(node.key), kind, node.key.start);
  }
  parsePostMemberNameModifiers(methodOrProp) {
  }
  parseClassPrivateProperty(node) {
    this.parseInitializer(node);
    this.semicolon();
    return this.finishNode(node, "ClassPrivateProperty");
  }
  parseClassProperty(node) {
    this.parseInitializer(node);
    this.semicolon();
    return this.finishNode(node, "ClassProperty");
  }
  parseClassAccessorProperty(node) {
    this.parseInitializer(node);
    this.semicolon();
    return this.finishNode(node, "ClassAccessorProperty");
  }
  parseInitializer(node) {
    this.scope.enter(576 | 16);
    this.expressionScope.enter(newExpressionScope());
    this.prodParam.enter(0);
    node.value = this.eat(25) ? this.parseMaybeAssignAllowIn() : null;
    this.expressionScope.exit();
    this.prodParam.exit();
    this.scope.exit();
  }
  parseClassId(node, isStatement, optionalId, bindingType = 8331) {
    if (tokenIsIdentifier(this.state.type)) {
      node.id = this.parseIdentifier();
      if (isStatement) {
        this.declareNameFromIdentifier(node.id, bindingType);
      }
    } else {
      if (optionalId || !isStatement) {
        node.id = null;
      } else {
        throw this.raise(Errors.MissingClassName, this.state.startLoc);
      }
    }
  }
  parseClassSuper(node) {
    if (this.eat(77)) {
      this.state.canStartArrow = false;
      node.superClass = this.parseExprSubscripts();
    } else {
      node.superClass = null;
    }
  }
  parseExport(node, decorators) {
    const maybeDefaultIdentifier = this.parseMaybeImportPhase(node, true);
    const hasDefault = this.maybeParseExportDefaultSpecifier(node, maybeDefaultIdentifier);
    const parseAfterDefault = !hasDefault || this.eat(8);
    const hasStar = parseAfterDefault && this.eatExportStar(node);
    const hasNamespace = hasStar && this.maybeParseExportNamespaceSpecifier(node);
    const parseAfterNamespace = parseAfterDefault && (!hasNamespace || this.eat(8));
    const isFromRequired = hasDefault || hasStar;
    if (hasStar && !hasNamespace) {
      if (hasDefault) this.unexpected();
      if (decorators) {
        throw this.raise(Errors.UnsupportedDecoratorExport, node);
      }
      this.parseExportFrom(node, true);
      this.sawUnambiguousESM = true;
      return this.finishNode(node, "ExportAllDeclaration");
    }
    const hasSpecifiers = this.maybeParseExportNamedSpecifiers(node);
    if (hasDefault && parseAfterDefault && !hasStar && !hasSpecifiers) {
      this.unexpected(null, 2);
    }
    if (hasNamespace && parseAfterNamespace) {
      this.unexpected(null, 94);
    }
    let hasDeclaration;
    if (isFromRequired || hasSpecifiers) {
      hasDeclaration = false;
      if (decorators) {
        throw this.raise(Errors.UnsupportedDecoratorExport, node);
      }
      this.parseExportFrom(node, isFromRequired);
    } else {
      hasDeclaration = this.maybeParseExportDeclaration(node);
    }
    if (isFromRequired || hasSpecifiers || hasDeclaration) {
      const node2 = node;
      this.checkExport(node2, true, false, !!node2.source);
      if (node2.declaration?.type === "ClassDeclaration") {
        this.maybeTakeDecorators(decorators, node2.declaration, node2);
      } else if (decorators) {
        throw this.raise(Errors.UnsupportedDecoratorExport, node);
      }
      this.sawUnambiguousESM = true;
      return this.finishNode(node2, "ExportNamedDeclaration");
    }
    if (this.eat(61)) {
      const node2 = node;
      const decl = this.parseExportDefaultExpression();
      node2.declaration = decl;
      if (decl.type === "ClassDeclaration") {
        this.maybeTakeDecorators(decorators, decl, node2);
      } else if (decorators) {
        throw this.raise(Errors.UnsupportedDecoratorExport, node);
      }
      this.checkExport(node2, true, true);
      this.sawUnambiguousESM = true;
      return this.finishNode(node2, "ExportDefaultDeclaration");
    }
    throw this.unexpected(null, 2);
  }
  eatExportStar(_) {
    return this.eat(51);
  }
  maybeParseExportDefaultSpecifier(node, maybeDefaultIdentifier) {
    if (maybeDefaultIdentifier || this.isExportDefaultSpecifier()) {
      this.expectPlugin("exportDefaultFrom", maybeDefaultIdentifier?.start);
      const id = maybeDefaultIdentifier || this.parseIdentifier(true);
      const specifier = this.startNodeAtNode(id);
      specifier.exported = id;
      node.specifiers = [this.finishNode(specifier, "ExportDefaultSpecifier")];
      return true;
    }
    return false;
  }
  maybeParseExportNamespaceSpecifier(node) {
    if (this.isContextual(89)) {
      node.specifiers ??= [];
      const specifier = this.startNodeAt(this.state.lastTokStartLoc);
      this.next();
      specifier.exported = this.parseModuleExportName();
      node.specifiers.push(this.finishNode(specifier, "ExportNamespaceSpecifier"));
      return true;
    }
    return false;
  }
  maybeParseExportNamedSpecifiers(node) {
    if (this.match(2)) {
      const node2 = node;
      if (!node2.specifiers) node2.specifiers = [];
      const isTypeExport = node2.exportKind === "type";
      node2.specifiers.push(...this.parseExportSpecifiers(isTypeExport));
      node2.source = null;
      node2.attributes = [];
      node2.declaration = null;
      return true;
    }
    return false;
  }
  maybeParseExportDeclaration(node) {
    if (this.shouldParseExportDeclaration()) {
      node.specifiers = [];
      node.source = null;
      node.attributes = [];
      node.declaration = this.parseExportDeclaration(node);
      return true;
    }
    return false;
  }
  isAsyncFunction() {
    if (!this.isContextual(91)) return false;
    const next = this.nextTokenInLineStart();
    return this.isUnparsedContextual(next, "function");
  }
  parseExportDefaultExpression() {
    const expr = this.startNode();
    if (this.match(64)) {
      this.next();
      return this.parseFunction(expr, 1 | 4);
    } else if (this.isAsyncFunction()) {
      this.next();
      this.next();
      return this.parseFunction(expr, 1 | 4 | 8);
    }
    if (this.match(76)) {
      return this.parseClass(expr, true, true);
    }
    if (this.match(22)) {
      return this.parseClass(this.maybeTakeDecorators(this.parseDecorators(false), this.startNode()), true, true);
    }
    if (this.match(71) || this.match(70) || this.isLet() || this.isUsing() || this.isAwaitUsing()) {
      throw this.raise(Errors.UnsupportedDefaultExport, this.state.startLoc);
    }
    const res = this.parseMaybeAssignAllowIn();
    this.semicolon();
    return res;
  }
  parseExportDeclaration(node) {
    if (this.match(76)) {
      const node2 = this.parseClass(this.startNode(), true, false);
      return node2;
    }
    return this.parseStatementListItem();
  }
  isExportDefaultSpecifier() {
    const {
      type
    } = this.state;
    if (tokenIsIdentifier(type)) {
      if (type === 91 && !this.state.containsEsc || type === 96) {
        return false;
      }
      if ((type === 126 || type === 125) && !this.state.containsEsc) {
        const next2 = this.nextTokenStart();
        const nextChar = this.input.charCodeAt(next2);
        if (nextChar === 123 || this.chStartsBindingIdentifier(nextChar, next2) && !this.input.startsWith("from", next2)) {
          this.expectOnePlugin(["flow", "typescript"]);
          return false;
        }
      }
    } else if (!this.match(61)) {
      return false;
    }
    const next = this.nextTokenStart();
    const hasFrom = this.isUnparsedContextual(next, "from");
    if (this.input.charCodeAt(next) === 44 || tokenIsIdentifier(this.state.type) && hasFrom) {
      return true;
    }
    if (this.match(61) && hasFrom) {
      const nextAfterFrom = this.input.charCodeAt(this.nextTokenStartSince(next + 4));
      return nextAfterFrom === 34 || nextAfterFrom === 39;
    }
    return false;
  }
  parseExportFrom(node, expect) {
    if (this.eatContextual(94)) {
      node.source = this.parseImportSource();
      this.checkExport(node);
      this.maybeParseImportAttributes(node);
    } else if (expect) {
      this.unexpected();
    }
    this.semicolon();
  }
  shouldParseExportDeclaration() {
    const {
      type
    } = this.state;
    if (type === 22) {
      this.expectOnePlugin(["decorators", "decorators-legacy"]);
      if (this.hasPlugin("decorators")) {
        return true;
      }
    }
    if (this.isUsing()) {
      this.raise(Errors.UsingDeclarationExport, this.state.startLoc);
      return true;
    }
    if (this.isAwaitUsing()) {
      this.raise(Errors.UsingDeclarationExport, this.state.startLoc);
      return true;
    }
    return type === 70 || type === 71 || type === 64 || type === 76 || this.isLet() || this.isAsyncFunction();
  }
  checkExport(node, checkNames, isDefault, isFrom) {
    if (checkNames) {
      if (isDefault) {
        this.checkDuplicateExports(node, "default");
        if (this.hasPlugin("exportDefaultFrom")) {
          const declaration = node.declaration;
          if (declaration.type === "Identifier" && declaration.name === "from" && declaration.end - declaration.start === 4 && !declaration.extra?.parenthesized) {
            this.raise(Errors.ExportDefaultFromAsIdentifier, declaration);
          }
        }
      } else if (node.specifiers?.length) {
        for (const specifier of node.specifiers) {
          const {
            exported
          } = specifier;
          const exportName = exported.type === "Identifier" ? exported.name : exported.value;
          this.checkDuplicateExports(specifier, exportName);
          if (!isFrom && specifier.local) {
            const {
              local
            } = specifier;
            if (local.type !== "Identifier") {
              this.raise(Errors.ExportBindingIsString, specifier, {
                localName: local.value,
                exportName
              });
            } else {
              this.checkReservedWord(local.name, local.start, true, false);
              this.scope.checkLocalExport(local);
            }
          }
        }
      } else if (node.declaration) {
        const decl = node.declaration;
        if (decl.type === "FunctionDeclaration" || decl.type === "ClassDeclaration") {
          const {
            id
          } = decl;
          if (!id) throw new Error("Assertion failure");
          this.checkDuplicateExports(node, id.name);
        } else if (decl.type === "VariableDeclaration") {
          for (const declaration of decl.declarations) {
            this.checkDeclaration(declaration.id);
          }
        }
      }
    }
  }
  checkDeclaration(node) {
    if (node.type === "Identifier") {
      this.checkDuplicateExports(node, node.name);
    } else if (node.type === "ObjectPattern") {
      for (const prop of node.properties) {
        this.checkDeclaration(prop);
      }
    } else if (node.type === "ArrayPattern") {
      for (const elem of node.elements) {
        if (elem) {
          this.checkDeclaration(elem);
        }
      }
    } else if (node.type === "ObjectProperty") {
      this.checkDeclaration(node.value);
    } else if (node.type === "RestElement") {
      this.checkDeclaration(node.argument);
    } else if (node.type === "AssignmentPattern") {
      this.checkDeclaration(node.left);
    }
  }
  checkDuplicateExports(node, exportName) {
    if (this.exportedIdentifiers.has(exportName)) {
      if (exportName === "default") {
        this.raise(Errors.DuplicateDefaultExport, node);
      } else {
        this.raise(Errors.DuplicateExport, node, {
          exportName
        });
      }
    }
    this.exportedIdentifiers.add(exportName);
  }
  parseExportSpecifiers(isInTypeExport) {
    const nodes = [];
    let first = true;
    this.expect(2);
    while (!this.eat(4)) {
      if (first) {
        first = false;
      } else {
        this.expect(8);
        if (this.eat(4)) break;
      }
      const isMaybeTypeOnly = this.isContextual(126);
      const isString = this.match(130);
      const node = this.startNode();
      node.local = this.parseModuleExportName();
      nodes.push(this.parseExportSpecifier(node, isString, isInTypeExport, isMaybeTypeOnly));
    }
    return nodes;
  }
  parseExportSpecifier(node, isString, isInTypeExport, isMaybeTypeOnly) {
    if (this.eatContextual(89)) {
      node.exported = this.parseModuleExportName();
    } else if (isString) {
      node.exported = this.cloneStringLiteral(node.local);
    } else if (!node.exported) {
      node.exported = this.cloneIdentifier(node.local);
    }
    return this.finishNode(node, "ExportSpecifier");
  }
  parseModuleExportName() {
    if (this.match(130)) {
      const result = this.parseStringLiteral(this.state.value);
      const surrogate = loneSurrogate.exec(result.value);
      if (surrogate) {
        this.raise(Errors.ModuleExportNameHasLoneSurrogate, result, {
          surrogateCharCode: surrogate[0].charCodeAt(0)
        });
      }
      return result;
    }
    return this.parseIdentifier(true);
  }
  checkImportPhase(node) {
    const {
      specifiers
    } = node;
    const singleBindingType = specifiers.length === 1 ? specifiers[0].type : null;
    if (node.phase === "source") {
      if (singleBindingType !== "ImportDefaultSpecifier") {
        this.raise(Errors.SourcePhaseImportRequiresDefault, specifiers[0]);
      }
    } else if (node.phase === "defer") {
      if (singleBindingType !== "ImportNamespaceSpecifier") {
        this.raise(Errors.DeferImportRequiresNamespace, specifiers[0]);
      }
    }
  }
  isPotentialImportPhase(isExport) {
    if (isExport) return false;
    return this.isContextual(101) || this.isContextual(93);
  }
  applyImportPhase(node, isExport, phase, loc) {
    if (isExport) {
      return;
    }
    if (phase === "source") {
      this.expectPlugin("sourcePhaseImports", loc);
      node.phase = "source";
    } else if (phase === "defer") {
      this.expectPlugin("deferredImportEvaluation", loc);
      node.phase = "defer";
    } else if (this.hasPlugin("sourcePhaseImports")) {
      node.phase = null;
    }
  }
  parseMaybeImportPhase(node, isExport) {
    if (!this.isPotentialImportPhase(isExport)) {
      this.applyImportPhase(node, isExport, null);
      return null;
    }
    const phaseIdentifier = this.startNode();
    const phaseIdentifierName = this.parseIdentifierName(true);
    const {
      type
    } = this.state;
    const isImportPhase = tokenIsKeywordOrIdentifier(type) ? type !== 94 || this.lookaheadCharCode() === 102 : type !== 8;
    if (isImportPhase) {
      this.applyImportPhase(node, isExport, phaseIdentifierName, phaseIdentifier.start);
      return null;
    } else {
      this.applyImportPhase(node, isExport, null);
      return this.createIdentifier(phaseIdentifier, phaseIdentifierName);
    }
  }
  isPrecedingIdImportPhase(phase) {
    const {
      type
    } = this.state;
    return tokenIsIdentifier(type) ? type !== 94 || this.lookaheadCharCode() === 102 : type !== 8;
  }
  parseImport(node) {
    if (this.match(130)) {
      return this.parseImportSourceAndAttributes(node);
    }
    return this.parseImportSpecifiersAndAfter(node, this.parseMaybeImportPhase(node, false));
  }
  parseImportSpecifiersAndAfter(node, maybeDefaultIdentifier) {
    node.specifiers = [];
    const hasDefault = this.maybeParseDefaultImportSpecifier(node, maybeDefaultIdentifier);
    const parseNext = !hasDefault || this.eat(8);
    const hasStar = parseNext && this.maybeParseStarImportSpecifier(node);
    if (parseNext && !hasStar) this.parseNamedImportSpecifiers(node);
    this.expectContextual(94);
    return this.parseImportSourceAndAttributes(node);
  }
  parseImportSourceAndAttributes(node) {
    node.specifiers ??= [];
    node.source = this.parseImportSource();
    this.maybeParseImportAttributes(node);
    this.checkImportPhase(node);
    this.semicolon();
    this.sawUnambiguousESM = true;
    return this.finishNode(node, "ImportDeclaration");
  }
  parseImportSource() {
    if (!this.match(130)) this.unexpected();
    return this.parseExprAtom();
  }
  parseImportSpecifierLocal(node, specifier, type) {
    specifier.local = this.parseIdentifier();
    node.specifiers.push(this.finishImportSpecifier(specifier, type));
  }
  finishImportSpecifier(specifier, type, bindingType = 8201) {
    this.checkLVal(specifier.local, {
      type
    }, bindingType);
    return this.finishNode(specifier, type);
  }
  parseImportAttributes() {
    this.expect(2);
    const attrs = [];
    const attrNames = /* @__PURE__ */ new Set();
    do {
      if (this.match(4)) {
        break;
      }
      const node = this.startNode();
      const keyName = this.state.value;
      if (attrNames.has(keyName)) {
        this.raise(Errors.ModuleAttributesWithDuplicateKeys, this.state.startLoc, {
          key: keyName
        });
      }
      attrNames.add(keyName);
      if (this.match(130)) {
        node.key = this.parseStringLiteral(keyName);
      } else {
        node.key = this.parseIdentifier(true);
      }
      this.expect(10);
      if (!this.match(130)) {
        throw this.raise(Errors.ModuleAttributeInvalidValue, this.state.startLoc);
      }
      node.value = this.parseStringLiteral(this.state.value);
      attrs.push(this.finishNode(node, "ImportAttribute"));
    } while (this.eat(8));
    this.expect(4);
    return attrs;
  }
  maybeParseImportAttributes(node) {
    let attributes;
    if (this.match(72)) {
      if (this.hasPrecedingLineBreak() && this.lookaheadCharCode() === 40) {
        return;
      }
      this.next();
      attributes = this.parseImportAttributes();
    } else {
      attributes = [];
    }
    node.attributes = attributes;
  }
  maybeParseDefaultImportSpecifier(node, maybeDefaultIdentifier) {
    if (maybeDefaultIdentifier) {
      const specifier = this.startNodeAtNode(maybeDefaultIdentifier);
      specifier.local = maybeDefaultIdentifier;
      node.specifiers.push(this.finishImportSpecifier(specifier, "ImportDefaultSpecifier"));
      return true;
    } else if (tokenIsKeywordOrIdentifier(this.state.type)) {
      this.parseImportSpecifierLocal(node, this.startNode(), "ImportDefaultSpecifier");
      return true;
    }
    return false;
  }
  maybeParseStarImportSpecifier(node) {
    if (this.match(51)) {
      const specifier = this.startNode();
      this.next();
      this.expectContextual(89);
      this.parseImportSpecifierLocal(node, specifier, "ImportNamespaceSpecifier");
      return true;
    }
    return false;
  }
  parseNamedImportSpecifiers(node) {
    let first = true;
    this.expect(2);
    while (!this.eat(4)) {
      if (first) {
        first = false;
      } else {
        if (this.eat(10)) {
          throw this.raise(Errors.DestructureNamedImport, this.state.startLoc);
        }
        this.expect(8);
        if (this.eat(4)) break;
      }
      const specifier = this.startNode();
      const importedIsString = this.match(130);
      const isMaybeTypeOnly = this.isContextual(126);
      specifier.imported = this.parseModuleExportName();
      const importSpecifier = this.parseImportSpecifier(specifier, importedIsString, node.importKind === "type" || node.importKind === "typeof", isMaybeTypeOnly, void 0);
      node.specifiers.push(importSpecifier);
    }
  }
  parseImportSpecifier(specifier, importedIsString, isInTypeOnlyImport, isMaybeTypeOnly, bindingType) {
    if (this.eatContextual(89)) {
      specifier.local = this.parseIdentifier();
    } else {
      const {
        imported
      } = specifier;
      if (importedIsString) {
        throw this.raise(Errors.ImportBindingIsString, specifier, {
          importName: imported.value
        });
      }
      this.checkReservedWord(imported.name, specifier.start, true, true);
      if (!specifier.local) {
        specifier.local = this.cloneIdentifier(imported);
      }
    }
    return this.finishImportSpecifier(specifier, "ImportSpecifier", bindingType);
  }
  isThisParam(param) {
    return param.type === "Identifier" && param.name === "this";
  }
};
var keywordAndTSRelationalOperator = /in(?:stanceof)?|as|satisfies/y;
function nonNull(x) {
  if (x == null) {
    throw new Error(`Unexpected ${x} value.`);
  }
  return x;
}
function assert(x) {
  if (!x) {
    throw new Error("Assert fail");
  }
}
var TSErrorTemplates = {
  AbstractMethodHasImplementation: ({
    methodName
  }) => `Method '${methodName}' cannot have an implementation because it is marked abstract.`,
  AbstractPropertyHasInitializer: ({
    propertyName
  }) => `Property '${propertyName}' cannot have an initializer because it is marked abstract.`,
  AccessorCannotBeOptional: "An 'accessor' property cannot be declared optional.",
  AccessorCannotDeclareThisParameter: "'get' and 'set' accessors cannot declare 'this' parameters.",
  AccessorCannotHaveTypeParameters: "An accessor cannot have type parameters.",
  ClassMethodHasDeclare: "Class methods cannot have the 'declare' modifier.",
  ClassMethodHasReadonly: "Class methods cannot have the 'readonly' modifier.",
  ConstInitializerMustBeStringOrNumericLiteralOrLiteralEnumReference: "A 'const' initializer in an ambient context must be a string or numeric literal or literal enum reference.",
  ConstructorHasTypeParameters: "Type parameters cannot appear on a constructor declaration.",
  DeclaratorDefiniteAssertionRequiresTypeAnnotation: "Declarations with definite assignment assertions must also have type annotations.",
  DeclaratorDefiniteAssertionWithInitializer: "Declarations with initializers cannot also have definite assignment assertions.",
  DeclareAccessor: ({
    kind
  }) => `'declare' is not allowed in ${kind}ters.`,
  DeclareClassFieldHasInitializer: "Initializers are not allowed in ambient contexts.",
  DeclareFunctionHasImplementation: "An implementation cannot be declared in ambient contexts.",
  DecoratorAbstractMethod: ({
    kind
  }) => `Decorators can't be used with ${kind.startsWith("a") ? "an" : "a"} ${kind}.`,
  DuplicateAccessibilityModifier: ({
    modifier
  }) => `Accessibility modifier already seen: '${modifier}'.`,
  DuplicateModifier: ({
    modifier
  }) => `Duplicate modifier: '${modifier}'.`,
  EmptyHeritageClauseType: ({
    token
  }) => `'${token}' list cannot be empty.`,
  EmptyNamespaceName: "Namespace must be given a name.",
  EmptyTypeArguments: "Type argument list cannot be empty.",
  EmptyTypeParameters: "Type parameter list cannot be empty.",
  ExpectedAmbientAfterExportDeclare: "'export declare' must be followed by an ambient declaration.",
  ExportAssignmentInTSNamespace: "An export assignment cannot be used in a namespace.",
  ExportInTSNamespace: "Export declarations are not permitted in a namespace.",
  ImportAliasHasImportType: "An import alias can not use 'import type'.",
  ImportInTSNamespace: "Import declarations in a namespace cannot reference a module.",
  IncompatibleModifiers: ({
    modifiers
  }) => `'${modifiers[0]}' modifier cannot be used with '${modifiers[1]}' modifier.`,
  IndexSignatureHasAbstract: "Index signatures cannot have the 'abstract' modifier.",
  IndexSignatureHasAccessibility: ({
    modifier
  }) => `Index signatures cannot have an accessibility modifier ('${modifier}').`,
  IndexSignatureHasDeclare: "Index signatures cannot have the 'declare' modifier.",
  IndexSignatureHasOverride: "'override' modifier cannot appear on an index signature.",
  IndexSignatureHasStatic: "Index signatures cannot have the 'static' modifier.",
  InitializerNotAllowedInAmbientContext: "Initializers are not allowed in ambient contexts.",
  InlineModuleDeclarationMustUseString: "`module ... {}` declarations must have a string name. Use `namespace ... {}` instead.",
  InvalidHeritageClauseType: ({
    token
  }) => `'${token}' list can only include identifiers or qualified-names with optional type arguments.`,
  InvalidModifierOnAwaitUsingDeclaration: (modifier) => `'${modifier}' modifier cannot appear on an await using declaration.`,
  InvalidModifierOnTypeMember: ({
    modifier
  }) => `'${modifier}' modifier cannot appear on a type member.`,
  InvalidModifierOnTypeParameter: ({
    modifier
  }) => `'${modifier}' modifier cannot appear on a type parameter.`,
  InvalidModifierOnTypeParameterPositions: ({
    modifier
  }) => `'${modifier}' modifier can only appear on a type parameter of a class, interface or type alias.`,
  InvalidModifierOnUsingDeclaration: (modifier) => `'${modifier}' modifier cannot appear on a using declaration.`,
  InvalidModifiersOrder: ({
    orderedModifiers
  }) => `'${orderedModifiers[0]}' modifier must precede '${orderedModifiers[1]}' modifier.`,
  InvalidNamespaceName: (value) => `Namespace name cannot be '${value}'.`,
  InvalidPropertyAccessAfterInstantiationExpression: "Invalid property access after an instantiation expression. You can either wrap the instantiation expression in parentheses, or delete the type arguments.",
  InvalidTupleMemberLabel: "Tuple members must be labeled with a simple identifier.",
  MissingInterfaceName: "'interface' declarations must be followed by an identifier.",
  NamespaceExportInTSNamespace: "Global module exports may only appear at top level.",
  NonAbstractClassHasAbstractMethod: "Abstract methods can only appear within an abstract class.",
  NonClassMethodPropertyHasAbstractModifier: "'abstract' modifier can only appear on a class, method, or property declaration.",
  OptionalTypeBeforeRequired: "A required element cannot follow an optional element.",
  OverrideNotInSubClass: "This member cannot have an 'override' modifier because its containing class does not extend another class.",
  PatternIsOptional: "A binding pattern parameter cannot be optional in an implementation signature.",
  PrivateElementHasAbstract: "Private elements cannot have the 'abstract' modifier.",
  PrivateElementHasAccessibility: ({
    modifier
  }) => `Private elements cannot have an accessibility modifier ('${modifier}').`,
  ReadonlyForMethodSignature: "'readonly' modifier can only appear on a property declaration or index signature.",
  ReservedArrowTypeParam: "This syntax is reserved in files with the .mts or .cts extension. Add a trailing comma, as in `<T,>() => ...`.",
  ReservedTypeAssertion: "This syntax is reserved in files with the .mts or .cts extension. Use an `as` expression instead.",
  SetAccessorCannotHaveOptionalParameter: "A 'set' accessor cannot have an optional parameter.",
  SetAccessorCannotHaveRestParameter: "A 'set' accessor cannot have rest parameter.",
  SetAccessorCannotHaveReturnType: "A 'set' accessor cannot have a return type annotation.",
  SingleTypeParameterWithoutTrailingComma: ({
    typeParameterName
  }) => `Single type parameter ${typeParameterName} should have a trailing comma. Example usage: <${typeParameterName},>.`,
  StaticBlockCannotHaveModifier: "Static class blocks cannot have any modifier.",
  TupleOptionalAfterType: "A labeled tuple optional element must be declared using a question mark after the name and before the colon (`name?: type`), rather than after the type (`name: type?`).",
  TypeAnnotationAfterAssign: "Type annotations must come before default assignments, e.g. instead of `age = 25: number` use `age: number = 25`.",
  TypeImportCannotSpecifyDefaultAndNamed: "A type-only import can specify a default import or named bindings, but not both.",
  TypeModifierIsUsedInTypeExports: "The 'type' modifier cannot be used on a named export when 'export type' is used on its export statement.",
  TypeModifierIsUsedInTypeImports: "The 'type' modifier cannot be used on a named import when 'import type' is used on its import statement.",
  UnexpectedParameterInitializer: "A parameter initializer is only allowed in a function or constructor implementation.",
  UnexpectedParameterModifier: "A parameter property is only allowed in a constructor implementation.",
  UnexpectedReadonly: "'readonly' type modifier is only permitted on array and tuple literal types.",
  UnexpectedTypeAnnotation: "Did not expect a type annotation here.",
  UnexpectedTypeCastInParameter: "Unexpected type cast in parameter position.",
  UnexpectedTypeDeclaration: (type) => `'${type}' declarations can only be declared inside a block.`,
  UnsupportedImportTypeArgument: "Argument in a type import must be a string literal.",
  UnsupportedParameterPropertyKind: "A parameter property may not be declared using a binding pattern.",
  UnsupportedSignatureParameterKind: ({
    type
  }) => `Name in a signature must be an Identifier, ObjectPattern or ArrayPattern, instead got ${type}.`,
  UsingDeclarationInAmbientContext: (kind) => `'${kind}' declarations are not allowed in ambient contexts.`
};
var TSErrors = ParseErrorEnum`typescript`(TSErrorTemplates);
function keywordTypeFromName(value) {
  switch (value) {
    case "any":
      return "TSAnyKeyword";
    case "boolean":
      return "TSBooleanKeyword";
    case "bigint":
      return "TSBigIntKeyword";
    case "never":
      return "TSNeverKeyword";
    case "number":
      return "TSNumberKeyword";
    case "object":
      return "TSObjectKeyword";
    case "string":
      return "TSStringKeyword";
    case "symbol":
      return "TSSymbolKeyword";
    case "undefined":
      return "TSUndefinedKeyword";
    case "unknown":
      return "TSUnknownKeyword";
    default:
      return void 0;
  }
}
function tsIsAccessModifier(modifier) {
  return modifier === "private" || modifier === "public" || modifier === "protected";
}
function tsIsVarianceAnnotations(modifier) {
  return modifier === "in" || modifier === "out";
}
function tsIsEntityName(node) {
  if (node.extra?.parenthesized) {
    return false;
  }
  switch (node.type) {
    case "Identifier":
      return true;
    case "MemberExpression":
      return !node.computed && tsIsEntityName(node.object);
    case "TSInstantiationExpression":
      return tsIsEntityName(node.expression);
    default:
      return false;
  }
}
var typescript = (superClass) => class TypeScriptParserMixin extends superClass {
  getScopeHandler() {
    return TypeScriptScopeHandler;
  }
  tsIsIdentifier() {
    return tokenIsIdentifier(this.state.type);
  }
  tsTokenCanFollowModifier() {
    return this.match(0) || this.match(2) || this.match(51) || this.match(17) || this.match(134) || this.isLiteralPropertyName();
  }
  tsNextTokenOnSameLineAndCanFollowModifier() {
    this.next();
    if (this.hasPrecedingLineBreak()) {
      return false;
    }
    return this.tsTokenCanFollowModifier();
  }
  tsNextTokenCanFollowModifier() {
    if (this.match(102)) {
      this.next();
      return this.tsTokenCanFollowModifier();
    }
    return this.tsNextTokenOnSameLineAndCanFollowModifier();
  }
  tsParseModifier(allowedModifiers, stopOnStartOfClassStaticBlock, hasSeenStaticModifier) {
    if (!tokenIsIdentifier(this.state.type) && this.state.type !== 54 && this.state.type !== 71) {
      return void 0;
    }
    const modifier = this.state.value;
    if (allowedModifiers.includes(modifier)) {
      if (hasSeenStaticModifier && this.match(102)) {
        return void 0;
      }
      if (stopOnStartOfClassStaticBlock && this.tsIsStartOfStaticBlocks()) {
        return void 0;
      }
      if (this.tsTryParse(this.tsNextTokenCanFollowModifier.bind(this))) {
        return modifier;
      }
    }
    return void 0;
  }
  tsParseModifiers({
    allowedModifiers,
    disallowedModifiers,
    stopOnStartOfClassStaticBlock,
    errorTemplate = TSErrors.InvalidModifierOnTypeMember
  }, modified) {
    const enforceOrder = (loc, modifier, before, after) => {
      if (modifier === before && modified[after]) {
        this.raise(TSErrors.InvalidModifiersOrder, loc, {
          orderedModifiers: [before, after]
        });
      }
    };
    const incompatible = (loc, modifier, mod1, mod2) => {
      if (modified[mod1] && modifier === mod2 || modified[mod2] && modifier === mod1) {
        this.raise(TSErrors.IncompatibleModifiers, loc, {
          modifiers: [mod1, mod2]
        });
      }
    };
    for (; ; ) {
      const {
        startLoc
      } = this.state;
      const modifier = this.tsParseModifier(allowedModifiers.concat(disallowedModifiers ?? []), stopOnStartOfClassStaticBlock, modified.static);
      if (!modifier) break;
      if (tsIsAccessModifier(modifier)) {
        if (modified.accessibility) {
          this.raise(TSErrors.DuplicateAccessibilityModifier, startLoc, {
            modifier
          });
        } else {
          enforceOrder(startLoc, modifier, modifier, "override");
          enforceOrder(startLoc, modifier, modifier, "static");
          enforceOrder(startLoc, modifier, modifier, "readonly");
          modified.accessibility = modifier;
        }
      } else if (tsIsVarianceAnnotations(modifier)) {
        if (modified[modifier]) {
          this.raise(TSErrors.DuplicateModifier, startLoc, {
            modifier
          });
        }
        modified[modifier] = true;
        enforceOrder(startLoc, modifier, "in", "out");
      } else {
        if (Object.hasOwn(modified, modifier)) {
          this.raise(TSErrors.DuplicateModifier, startLoc, {
            modifier
          });
        } else {
          enforceOrder(startLoc, modifier, "static", "readonly");
          enforceOrder(startLoc, modifier, "static", "override");
          enforceOrder(startLoc, modifier, "override", "readonly");
          enforceOrder(startLoc, modifier, "abstract", "override");
          incompatible(startLoc, modifier, "declare", "override");
          incompatible(startLoc, modifier, "static", "abstract");
        }
        modified[modifier] = true;
      }
      if (disallowedModifiers?.includes(modifier)) {
        this.raise(errorTemplate, startLoc, {
          modifier
        });
      }
    }
  }
  tsIsListTerminator(kind) {
    switch (kind) {
      case "EnumMembers":
      case "TypeMembers":
        return this.match(4);
      case "HeritageClauseElement":
        return this.match(2);
      case "TupleElementTypes":
        return this.match(1);
      case "TypeParametersOrArguments":
        return this.match(44);
    }
  }
  tsParseList(kind, parseElement) {
    const result = [];
    while (!this.tsIsListTerminator(kind)) {
      result.push(parseElement());
    }
    return result;
  }
  tsParseDelimitedList(kind, parseElement, refTrailingCommaPos) {
    return nonNull(this.tsParseDelimitedListWorker(kind, parseElement, true, refTrailingCommaPos));
  }
  tsParseDelimitedListWorker(kind, parseElement, expectSuccess, refTrailingCommaPos) {
    const result = [];
    let trailingCommaPos = -1;
    for (; ; ) {
      if (this.tsIsListTerminator(kind)) {
        break;
      }
      trailingCommaPos = -1;
      const element = parseElement();
      if (element == null) {
        return void 0;
      }
      result.push(element);
      if (this.eat(8)) {
        trailingCommaPos = this.state.lastTokStartLoc.index;
        continue;
      }
      if (this.tsIsListTerminator(kind)) {
        break;
      }
      if (expectSuccess) {
        this.expect(8);
      }
      return void 0;
    }
    if (refTrailingCommaPos) {
      refTrailingCommaPos.value = trailingCommaPos;
    }
    return result;
  }
  tsParseBracketedList(kind, parseElement, bracket, skipFirstToken, refTrailingCommaPos) {
    if (!skipFirstToken) {
      if (bracket) {
        this.expect(0);
      } else {
        this.expect(43);
      }
    }
    const result = this.tsParseDelimitedList(kind, parseElement, refTrailingCommaPos);
    if (bracket) {
      this.expect(1);
    } else {
      this.expect(44);
    }
    return result;
  }
  tsParseImportType() {
    const node = this.startNode();
    this.expect(79);
    this.expect(6);
    if (!this.match(130)) {
      this.raise(TSErrors.UnsupportedImportTypeArgument, this.state.startLoc);
      node.source = this.tsParseNonConditionalType();
    } else {
      node.source = this.parseStringLiteral(this.state.value);
    }
    if (this.eat(8)) {
      node.options = this.tsParseImportTypeOptions();
    } else {
      node.options = null;
    }
    this.expect(7);
    if (this.eat(12)) {
      node.qualifier = this.tsParseEntityName(1 | 2);
    }
    if (this.match(43)) {
      node.typeArguments = this.tsParseTypeArguments();
    }
    return this.finishNode(node, "TSImportType");
  }
  tsParseImportTypeOptions() {
    const node = this.startNode();
    this.expect(2);
    const withProperty = this.startNode();
    if (this.isContextual(72)) {
      withProperty.method = false;
      withProperty.key = this.parseIdentifier(true);
      withProperty.computed = false;
      withProperty.shorthand = false;
    } else {
      this.unexpected(null, 72);
    }
    this.expect(10);
    withProperty.value = this.tsParseImportTypeWithPropertyValue();
    node.properties = [this.finishObjectProperty(withProperty)];
    this.eat(8);
    this.expect(4);
    return this.finishNode(node, "ObjectExpression");
  }
  tsParseImportTypeWithPropertyValue() {
    const node = this.startNode();
    const properties = [];
    this.expect(2);
    while (!this.match(4)) {
      const type = this.state.type;
      if (tokenIsIdentifier(type) || type === 130) {
        properties.push(super.parsePropertyDefinition(null));
      } else {
        this.unexpected();
      }
      this.eat(8);
    }
    node.properties = properties;
    this.next();
    return this.finishNode(node, "ObjectExpression");
  }
  tsParseEntityName(flags) {
    let entity;
    if (flags & 1 && this.match(74)) {
      if (flags & 2) {
        entity = this.parseIdentifier(true);
      } else {
        const node = this.startNode();
        this.next();
        entity = this.finishNode(node, "ThisExpression");
      }
    } else {
      entity = this.parseIdentifier(!!(flags & 1));
    }
    while (this.eat(12)) {
      const node = this.startNodeAtNode(entity);
      node.left = entity;
      node.right = this.parseIdentifier(!!(flags & 1));
      entity = this.finishNode(node, "TSQualifiedName");
    }
    return entity;
  }
  tsParseTypeReference() {
    const node = this.startNode();
    node.typeName = this.tsParseEntityName(1);
    if (!this.hasPrecedingLineBreak() && this.match(43)) {
      node.typeArguments = this.tsParseTypeArguments();
    }
    return this.finishNode(node, "TSTypeReference");
  }
  tsParseThisTypePredicate(lhs) {
    this.next();
    const node = this.startNodeAtNode(lhs);
    node.parameterName = lhs;
    node.typeAnnotation = this.tsParseTypeAnnotation(false);
    node.asserts = false;
    return this.finishNode(node, "TSTypePredicate");
  }
  tsParseThisTypeNode() {
    const node = this.startNode();
    this.next();
    return this.finishNode(node, "TSThisType");
  }
  tsParseTypeQuery() {
    const node = this.startNode();
    this.expect(83);
    if (this.match(79)) {
      node.exprName = this.tsParseImportType();
    } else {
      node.exprName = this.tsParseEntityName(1);
    }
    if (!this.hasPrecedingLineBreak() && this.match(43)) {
      node.typeArguments = this.tsParseTypeArguments();
    }
    return this.finishNode(node, "TSTypeQuery");
  }
  tsParseInOutModifiers = this.tsParseModifiers.bind(this, {
    allowedModifiers: ["in", "out"],
    disallowedModifiers: ["const", "public", "private", "protected", "readonly", "declare", "abstract", "override"],
    errorTemplate: TSErrors.InvalidModifierOnTypeParameter
  });
  tsParseConstModifier = this.tsParseModifiers.bind(this, {
    allowedModifiers: ["const"],
    disallowedModifiers: ["in", "out"],
    errorTemplate: TSErrors.InvalidModifierOnTypeParameterPositions
  });
  tsParseInOutConstModifiers = this.tsParseModifiers.bind(this, {
    allowedModifiers: ["in", "out", "const"],
    disallowedModifiers: ["public", "private", "protected", "readonly", "declare", "abstract", "override"],
    errorTemplate: TSErrors.InvalidModifierOnTypeParameter
  });
  tsParseTypeParameter(parseModifiers) {
    const node = this.startNode();
    parseModifiers(node);
    node.name = this.tsParseTypeParameterName();
    node.constraint = this.tsEatThenParseType(77);
    node.default = this.tsEatThenParseType(25);
    return this.finishNode(node, "TSTypeParameter");
  }
  tsTryParseTypeParameters(parseModifiers) {
    if (this.match(43)) {
      return this.tsParseTypeParameters(parseModifiers);
    }
  }
  tsParseTypeParameters(parseModifiers) {
    const node = this.startNode();
    if (this.match(43) || this.match(138)) {
      this.next();
    } else {
      this.unexpected();
    }
    const refTrailingCommaPos = {
      value: -1
    };
    node.params = this.tsParseBracketedList("TypeParametersOrArguments", this.tsParseTypeParameter.bind(this, parseModifiers), false, true, refTrailingCommaPos);
    if (node.params.length === 0) {
      this.raise(TSErrors.EmptyTypeParameters, node);
    }
    if (refTrailingCommaPos.value !== -1) {
      this.addExtra(node, "trailingComma", refTrailingCommaPos.value);
    }
    return this.finishNode(node, "TSTypeParameterDeclaration");
  }
  tsFillSignature(returnToken, signature) {
    const returnTokenRequired = returnToken === 15;
    const paramsKey = "params";
    const returnTypeKey = "returnType";
    signature.typeParameters = this.tsTryParseTypeParameters(this.tsParseConstModifier);
    this.expect(6);
    signature[paramsKey] = this.tsParseBindingListForSignature();
    if (returnTokenRequired) {
      signature[returnTypeKey] = this.tsParseTypeOrTypePredicateAnnotation(returnToken);
    } else if (this.match(returnToken)) {
      signature[returnTypeKey] = this.tsParseTypeOrTypePredicateAnnotation(returnToken);
    }
  }
  tsParseBindingListForSignature() {
    const list2 = super.parseBindingList(7, 41, 2);
    for (const pattern2 of list2) {
      const {
        type
      } = pattern2;
      if (type === "AssignmentPattern" || type === "TSParameterProperty") {
        this.raise(TSErrors.UnsupportedSignatureParameterKind, pattern2, {
          type
        });
      }
    }
    return list2;
  }
  tsParseTypeMemberSemicolon() {
    if (!this.eat(8) && !this.isLineTerminator()) {
      this.expect(9);
    }
  }
  tsParseSignatureMember(kind, node) {
    this.tsFillSignature(10, node);
    this.tsParseTypeMemberSemicolon();
    return this.finishNode(node, kind);
  }
  tsIsUnambiguouslyIndexSignature() {
    this.next();
    if (tokenIsIdentifier(this.state.type)) {
      this.next();
      return this.match(10);
    }
    return false;
  }
  tsTryParseIndexSignature(node) {
    if (!(this.match(0) && this.tsLookAhead(this.tsIsUnambiguouslyIndexSignature.bind(this)))) {
      return;
    }
    this.expect(0);
    const id = this.parseIdentifier();
    id.typeAnnotation = this.tsParseTypeAnnotation();
    this.resetEndLocation(id);
    this.expect(1);
    node.parameters = [id];
    const type = this.tsTryParseTypeAnnotation();
    if (type) node.typeAnnotation = type;
    this.tsParseTypeMemberSemicolon();
    return this.finishNode(node, "TSIndexSignature");
  }
  tsParsePropertyOrMethodSignature(node, readonly) {
    if (this.eat(13)) node.optional = true;
    if (this.match(6) || this.match(43)) {
      if (readonly) {
        this.raise(TSErrors.ReadonlyForMethodSignature, node);
      }
      const method = node;
      if (method.kind && this.match(43)) {
        this.raise(TSErrors.AccessorCannotHaveTypeParameters, this.state.curPosition());
      }
      this.tsFillSignature(10, method);
      this.tsParseTypeMemberSemicolon();
      if (method.kind === "get") {
        if (method.params.length > 0) {
          this.raise(Errors.BadGetterArity, this.state.curPosition());
          if (this.isThisParam(method.params[0])) {
            this.raise(TSErrors.AccessorCannotDeclareThisParameter, this.state.curPosition());
          }
        }
      } else if (method.kind === "set") {
        if (method.params.length !== 1) {
          this.raise(Errors.BadSetterArity, this.state.curPosition());
        } else {
          const firstParameter = method.params[0];
          if (this.isThisParam(firstParameter)) {
            this.raise(TSErrors.AccessorCannotDeclareThisParameter, this.state.curPosition());
          }
          if (firstParameter.type === "Identifier" && firstParameter.optional) {
            this.raise(TSErrors.SetAccessorCannotHaveOptionalParameter, this.state.curPosition());
          }
          if (firstParameter.type === "RestElement") {
            this.raise(TSErrors.SetAccessorCannotHaveRestParameter, this.state.curPosition());
          }
        }
        if (method.returnType) {
          this.raise(TSErrors.SetAccessorCannotHaveReturnType, method.returnType);
        }
      } else {
        method.kind = "method";
      }
      return this.finishNode(method, "TSMethodSignature");
    } else {
      const property = node;
      if (readonly) property.readonly = true;
      const type = this.tsTryParseTypeAnnotation();
      if (type) property.typeAnnotation = type;
      this.tsParseTypeMemberSemicolon();
      return this.finishNode(property, "TSPropertySignature");
    }
  }
  tsParseTypeMember() {
    const node = this.startNode();
    if (this.match(6) || this.match(43)) {
      return this.tsParseSignatureMember("TSCallSignatureDeclaration", node);
    }
    if (this.match(73)) {
      const id = this.startNode();
      this.next();
      if (this.match(6) || this.match(43)) {
        return this.tsParseSignatureMember("TSConstructSignatureDeclaration", node);
      } else {
        node.key = this.createIdentifier(id, "new");
        return this.tsParsePropertyOrMethodSignature(node, false);
      }
    }
    this.tsParseModifiers({
      allowedModifiers: ["readonly"],
      disallowedModifiers: ["declare", "abstract", "private", "protected", "public", "static", "override"]
    }, node);
    const idx = this.tsTryParseIndexSignature(node);
    if (idx) {
      return idx;
    }
    super.parsePropertyName(node);
    if (!node.computed && node.key.type === "Identifier" && (node.key.name === "get" || node.key.name === "set") && this.tsTokenCanFollowModifier()) {
      node.kind = node.key.name;
      super.parsePropertyName(node);
      if (!this.match(6) && !this.match(43)) {
        this.unexpected(null, 6);
      }
    }
    return this.tsParsePropertyOrMethodSignature(node, !!node.readonly);
  }
  tsParseTypeLiteral() {
    const node = this.startNode();
    node.members = this.tsParseObjectTypeMembers();
    return this.finishNode(node, "TSTypeLiteral");
  }
  tsParseObjectTypeMembers() {
    this.expect(2);
    const members = this.tsParseList("TypeMembers", this.tsParseTypeMember.bind(this));
    this.expect(4);
    return members;
  }
  tsIsStartOfMappedType() {
    this.next();
    if (this.eat(49)) {
      return this.isContextual(118);
    }
    if (this.isContextual(118)) {
      this.next();
    }
    if (!this.match(0)) {
      return false;
    }
    this.next();
    if (!this.tsIsIdentifier()) {
      return false;
    }
    this.next();
    return this.match(54);
  }
  tsParseMappedType() {
    const node = this.startNode();
    this.expect(2);
    if (this.match(49)) {
      node.readonly = this.state.value;
      this.next();
      this.expectContextual(118);
    } else if (this.eatContextual(118)) {
      node.readonly = true;
    }
    this.expect(0);
    node.key = this.tsParseTypeParameterName();
    node.constraint = this.tsExpectThenParseType(54);
    node.nameType = this.eatContextual(89) ? this.tsParseType() : null;
    this.expect(1);
    if (this.match(49)) {
      node.optional = this.state.value;
      this.next();
      this.expect(13);
    } else if (this.eat(13)) {
      node.optional = true;
    }
    node.typeAnnotation = this.tsTryParseType();
    this.semicolon();
    this.expect(4);
    return this.finishNode(node, "TSMappedType");
  }
  tsParseTupleType() {
    const node = this.startNode();
    node.elementTypes = this.tsParseBracketedList("TupleElementTypes", this.tsParseTupleElementType.bind(this), true, false);
    let seenOptionalElement = false;
    node.elementTypes.forEach((elementNode) => {
      const {
        type
      } = elementNode;
      if (seenOptionalElement && type !== "TSRestType" && type !== "TSOptionalType" && !(type === "TSNamedTupleMember" && elementNode.optional)) {
        this.raise(TSErrors.OptionalTypeBeforeRequired, elementNode);
      }
      seenOptionalElement ||= type === "TSNamedTupleMember" && elementNode.optional || type === "TSOptionalType";
    });
    return this.finishNode(node, "TSTupleType");
  }
  tsParseTupleElementType() {
    const restStartLoc = this.state.startLoc;
    const rest = this.eat(17);
    const {
      startLoc
    } = this.state;
    let labeled;
    let label;
    let optional;
    let type;
    const isWord = tokenIsKeywordOrIdentifier(this.state.type);
    const chAfterWord = isWord ? this.lookaheadCharCode() : null;
    if (chAfterWord === 58) {
      labeled = true;
      optional = false;
      label = this.parseIdentifier(true);
      this.expect(10);
      type = this.tsParseType();
    } else if (chAfterWord === 63) {
      optional = true;
      const wordName = this.state.value;
      const typeOrLabel = this.tsParseNonArrayType();
      if (this.lookaheadCharCode() === 58) {
        labeled = true;
        label = this.createIdentifier(this.startNodeAt(startLoc), wordName);
        this.expect(13);
        this.expect(10);
        type = this.tsParseType();
      } else {
        labeled = false;
        type = typeOrLabel;
        this.expect(13);
      }
    } else {
      type = this.tsParseType();
      optional = this.eat(13);
      labeled = this.eat(10);
    }
    if (labeled) {
      let labeledNode;
      if (label) {
        labeledNode = this.startNodeAt(startLoc);
        labeledNode.optional = optional;
        labeledNode.label = label;
        labeledNode.elementType = type;
        if (this.eat(13)) {
          labeledNode.optional = true;
          this.raise(TSErrors.TupleOptionalAfterType, this.state.lastTokStartLoc);
        }
      } else {
        labeledNode = this.startNodeAt(startLoc);
        labeledNode.optional = optional;
        this.raise(TSErrors.InvalidTupleMemberLabel, type);
        labeledNode.label = type;
        labeledNode.elementType = this.tsParseType();
      }
      type = this.finishNode(labeledNode, "TSNamedTupleMember");
    } else if (optional) {
      const optionalTypeNode = this.startNodeAt(startLoc);
      optionalTypeNode.typeAnnotation = type;
      type = this.finishNode(optionalTypeNode, "TSOptionalType");
    }
    if (rest) {
      const restNode = this.startNodeAt(restStartLoc);
      restNode.typeAnnotation = type;
      type = this.finishNode(restNode, "TSRestType");
    }
    return type;
  }
  tsParseParenthesizedType() {
    const node = this.startNode();
    this.expect(6);
    node.typeAnnotation = this.tsParseType();
    this.expect(7);
    return this.finishNode(node, "TSParenthesizedType");
  }
  tsParseFunctionOrConstructorType(type, abstract2) {
    const node = this.startNode();
    if (type === "TSConstructorType") {
      node.abstract = !!abstract2;
      if (abstract2) this.next();
      this.next();
    }
    this.tsInAllowConditionalTypesContext(() => this.tsFillSignature(15, node));
    return this.finishNode(node, type);
  }
  tsParseLiteralTypeNode() {
    const node = this.startNode();
    switch (this.state.type) {
      case 131:
      case 132:
      case 130:
      case 81:
      case 82:
        node.literal = super.parseExprAtom();
        break;
      default:
        this.unexpected();
    }
    return this.finishNode(node, "TSLiteralType");
  }
  tsParseTemplateLiteralType() {
    const startLoc = this.state.startLoc;
    let curElt = this.parseTemplateElement(false);
    const quasis = [curElt];
    if (curElt.tail) {
      const node = this.startNodeAt(startLoc);
      const literal = this.startNodeAt(startLoc);
      literal.expressions = [];
      literal.quasis = quasis;
      node.literal = this.finishNode(literal, "TemplateLiteral");
      return this.finishNode(node, "TSLiteralType");
    } else {
      const substitutions = [];
      while (!curElt.tail) {
        substitutions.push(this.tsParseType());
        this.readTemplateContinuation();
        quasis.push(curElt = this.parseTemplateElement(false));
      }
      const node = this.startNodeAt(startLoc);
      node.types = substitutions;
      node.quasis = quasis;
      return this.finishNode(node, "TSTemplateLiteralType");
    }
  }
  parseTemplateSubstitution() {
    if (this.state.inType) return this.tsParseType();
    return super.parseTemplateSubstitution();
  }
  tsParseThisTypeOrThisTypePredicate() {
    const thisKeyword = this.tsParseThisTypeNode();
    if (this.isContextual(112) && !this.hasPrecedingLineBreak()) {
      return this.tsParseThisTypePredicate(thisKeyword);
    } else {
      return thisKeyword;
    }
  }
  tsParseNonArrayType() {
    switch (this.state.type) {
      case 130:
      case 131:
      case 132:
      case 81:
      case 82:
        return this.tsParseLiteralTypeNode();
      case 49:
        if (this.state.value === "-") {
          const node = this.startNode();
          const nextToken = this.lookahead();
          if (nextToken.type !== 131 && nextToken.type !== 132) {
            this.unexpected();
          }
          node.literal = this.parseMaybeUnary();
          return this.finishNode(node, "TSLiteralType");
        }
        break;
      case 74:
        return this.tsParseThisTypeOrThisTypePredicate();
      case 83:
        return this.tsParseTypeQuery();
      case 79:
        return this.tsParseImportType();
      case 2:
        return this.tsLookAhead(this.tsIsStartOfMappedType.bind(this)) ? this.tsParseMappedType() : this.tsParseTypeLiteral();
      case 0:
        return this.tsParseTupleType();
      case 6:
        if (!(this.optionFlags & 2048)) {
          const startLoc = this.state.startLoc;
          this.next();
          const type = this.tsParseType();
          this.expect(7);
          this.addExtra(type, "parenthesized", true);
          this.addExtra(type, "parenStart", startLoc.index);
          return type;
        }
        return this.tsParseParenthesizedType();
      case 21:
      case 20:
        return this.tsParseTemplateLiteralType();
      default: {
        const {
          type
        } = this.state;
        if (tokenIsIdentifier(type) || type === 84 || type === 80) {
          const nodeType = type === 84 ? "TSVoidKeyword" : type === 80 ? "TSNullKeyword" : keywordTypeFromName(this.state.value);
          if (nodeType !== void 0 && this.lookaheadCharCode() !== 46) {
            const node = this.startNode();
            this.next();
            return this.finishNode(node, nodeType);
          }
          return this.tsParseTypeReference();
        }
      }
    }
    throw this.unexpected();
  }
  tsParseArrayTypeOrHigher() {
    const {
      startLoc
    } = this.state;
    let type = this.tsParseNonArrayType();
    while (!this.hasPrecedingLineBreak() && this.eat(0)) {
      if (this.match(1)) {
        const node = this.startNodeAt(startLoc);
        node.elementType = type;
        this.expect(1);
        type = this.finishNode(node, "TSArrayType");
      } else {
        const node = this.startNodeAt(startLoc);
        node.objectType = type;
        node.indexType = this.tsParseType();
        this.expect(1);
        type = this.finishNode(node, "TSIndexedAccessType");
      }
    }
    return type;
  }
  tsParseTypeOperator() {
    const node = this.startNode();
    const operator = this.state.value;
    this.next();
    node.operator = operator;
    node.typeAnnotation = this.tsParseTypeOperatorOrHigher();
    if (operator === "readonly") {
      this.tsCheckTypeAnnotationForReadOnly(node);
    }
    return this.finishNode(node, "TSTypeOperator");
  }
  tsCheckTypeAnnotationForReadOnly(node) {
    switch (node.typeAnnotation.type) {
      case "TSTupleType":
      case "TSArrayType":
        return;
      default:
        this.raise(TSErrors.UnexpectedReadonly, node);
    }
  }
  tsParseInferType() {
    const node = this.startNode();
    this.expectContextual(111);
    const typeParameter = this.startNode();
    typeParameter.name = this.tsParseTypeParameterName();
    typeParameter.constraint = this.tsTryParse(() => this.tsParseConstraintForInferType());
    node.typeParameter = this.finishNode(typeParameter, "TSTypeParameter");
    return this.finishNode(node, "TSInferType");
  }
  tsParseConstraintForInferType() {
    if (this.eat(77)) {
      const constraint = this.tsInDisallowConditionalTypesContext(() => this.tsParseType());
      if (this.state.inDisallowConditionalTypesContext || !this.match(13)) {
        return constraint;
      }
    }
  }
  tsParseTypeOperatorOrHigher() {
    const isTypeOperator = tokenIsTSTypeOperator(this.state.type) && !this.state.containsEsc;
    return isTypeOperator ? this.tsParseTypeOperator() : this.isContextual(111) ? this.tsParseInferType() : this.tsInAllowConditionalTypesContext(() => this.tsParseArrayTypeOrHigher());
  }
  tsParseUnionOrIntersectionType(kind, parseConstituentType, operator) {
    const node = this.startNode();
    const hasLeadingOperator = this.eat(operator);
    const types2 = [];
    do {
      types2.push(parseConstituentType());
    } while (this.eat(operator));
    if (types2.length === 1 && !hasLeadingOperator) {
      return types2[0];
    }
    node.types = types2;
    return this.finishNode(node, kind);
  }
  tsParseIntersectionTypeOrHigher() {
    return this.tsParseUnionOrIntersectionType("TSIntersectionType", this.tsParseTypeOperatorOrHigher.bind(this), 41);
  }
  tsParseUnionTypeOrHigher() {
    return this.tsParseUnionOrIntersectionType("TSUnionType", this.tsParseIntersectionTypeOrHigher.bind(this), 39);
  }
  tsIsStartOfFunctionType() {
    if (this.match(43)) {
      return true;
    }
    return this.match(6) && this.tsLookAhead(this.tsIsUnambiguouslyStartOfFunctionType.bind(this));
  }
  tsSkipParameterStart() {
    if (tokenIsIdentifier(this.state.type) || this.match(74)) {
      this.next();
      return true;
    }
    if (this.match(2)) {
      const {
        errors
      } = this.state;
      const previousErrorCount = errors.length;
      try {
        this.parseObjectLike(4, true);
        return errors.length === previousErrorCount;
      } catch {
        return false;
      }
    }
    if (this.match(0)) {
      this.next();
      const {
        errors
      } = this.state;
      const previousErrorCount = errors.length;
      try {
        super.parseBindingList(1, 93, 1);
        return errors.length === previousErrorCount;
      } catch {
        return false;
      }
    }
    return false;
  }
  tsIsUnambiguouslyStartOfFunctionType() {
    this.next();
    if (this.match(7) || this.match(17)) {
      return true;
    }
    if (this.tsSkipParameterStart()) {
      if (this.match(10) || this.match(8) || this.match(13) || this.match(25)) {
        return true;
      }
      if (this.match(7)) {
        this.next();
        if (this.match(15)) {
          return true;
        }
      }
    }
    return false;
  }
  tsParseTypeOrTypePredicateAnnotation(returnToken) {
    return this.tsInType(() => {
      const t = this.startNode();
      this.expect(returnToken);
      const node = this.startNode();
      const asserts = !!this.tsTryParse(this.tsParseTypePredicateAsserts.bind(this));
      if (asserts && this.match(74)) {
        let thisTypePredicate = this.tsParseThisTypeOrThisTypePredicate();
        if (thisTypePredicate.type === "TSThisType") {
          node.parameterName = thisTypePredicate;
          node.asserts = true;
          node.typeAnnotation = null;
          thisTypePredicate = this.finishNode(node, "TSTypePredicate");
        } else {
          this.resetStartLocationFromNode(thisTypePredicate, node);
          thisTypePredicate.asserts = true;
        }
        t.typeAnnotation = thisTypePredicate;
        return this.finishNode(t, "TSTypeAnnotation");
      }
      const typePredicateVariable = this.tsIsIdentifier() && this.tsTryParse(this.tsParseTypePredicatePrefix.bind(this));
      if (!typePredicateVariable) {
        if (!asserts) {
          return this.tsParseTypeAnnotation(false, t);
        }
        node.parameterName = this.parseIdentifier();
        node.asserts = asserts;
        node.typeAnnotation = null;
        t.typeAnnotation = this.finishNode(node, "TSTypePredicate");
        return this.finishNode(t, "TSTypeAnnotation");
      }
      const type = this.tsParseTypeAnnotation(false);
      node.parameterName = typePredicateVariable;
      node.typeAnnotation = type;
      node.asserts = asserts;
      t.typeAnnotation = this.finishNode(node, "TSTypePredicate");
      return this.finishNode(t, "TSTypeAnnotation");
    });
  }
  tsTryParseTypeOrTypePredicateAnnotation() {
    if (this.match(10)) {
      return this.tsParseTypeOrTypePredicateAnnotation(10);
    }
  }
  tsTryParseTypeAnnotation() {
    if (this.match(10)) {
      return this.tsParseTypeAnnotation();
    }
  }
  tsTryParseType() {
    return this.tsEatThenParseType(10);
  }
  tsParseTypePredicatePrefix() {
    const id = this.parseIdentifier();
    if (this.isContextual(112) && !this.hasPrecedingLineBreak()) {
      this.next();
      return id;
    }
  }
  tsParseTypePredicateAsserts() {
    if (this.state.type !== 105) {
      return false;
    }
    const containsEsc = this.state.containsEsc;
    this.next();
    if (!tokenIsIdentifier(this.state.type) && !this.match(74)) {
      return false;
    }
    if (containsEsc) {
      this.raise(Errors.InvalidEscapedReservedWord, this.state.lastTokStartLoc, {
        reservedWord: "asserts"
      });
    }
    return true;
  }
  tsParseTypeAnnotation(eatColon = true, t = this.startNode()) {
    this.tsInType(() => {
      if (eatColon) this.expect(10);
      t.typeAnnotation = this.tsParseType();
    });
    return this.finishNode(t, "TSTypeAnnotation");
  }
  tsParseType() {
    assert(this.state.inType);
    const type = this.tsParseNonConditionalType();
    if (this.state.inDisallowConditionalTypesContext || this.hasPrecedingLineBreak() || !this.eat(77)) {
      return type;
    }
    const node = this.startNodeAtNode(type);
    node.checkType = type;
    node.extendsType = this.tsInDisallowConditionalTypesContext(() => this.tsParseNonConditionalType());
    this.expect(13);
    node.trueType = this.tsInAllowConditionalTypesContext(() => this.tsParseType());
    this.expect(10);
    node.falseType = this.tsInAllowConditionalTypesContext(() => this.tsParseType());
    return this.finishNode(node, "TSConditionalType");
  }
  isAbstractConstructorSignature() {
    return this.isContextual(120) && this.isLookaheadContextual("new");
  }
  tsParseNonConditionalType() {
    if (this.tsIsStartOfFunctionType()) {
      return this.tsParseFunctionOrConstructorType("TSFunctionType");
    }
    if (this.match(73)) {
      return this.tsParseFunctionOrConstructorType("TSConstructorType");
    } else if (this.isAbstractConstructorSignature()) {
      return this.tsParseFunctionOrConstructorType("TSConstructorType", true);
    }
    return this.tsParseUnionTypeOrHigher();
  }
  tsParseTypeAssertion() {
    if (this.getPluginOption("typescript", "disallowAmbiguousJSXLike")) {
      this.raise(TSErrors.ReservedTypeAssertion, this.state.startLoc);
    }
    const node = this.startNode();
    node.typeAnnotation = this.tsInType(() => {
      this.next();
      return this.match(71) ? this.tsParseTypeReference() : this.tsParseType();
    });
    this.expect(44);
    node.expression = this.parseMaybeUnary();
    return this.finishNode(node, "TSTypeAssertion");
  }
  tsParseHeritageClause(token) {
    const originalStartLoc = this.state.startLoc;
    const delimitedList = this.tsParseDelimitedList("HeritageClauseElement", () => {
      const expression = (this.state.canStartArrow = false, super.parseExprSubscripts());
      if (!tsIsEntityName(expression)) {
        this.raise(TSErrors.InvalidHeritageClauseType, expression.start, {
          token
        });
      }
      const nodeType = token === "extends" ? "TSInterfaceHeritage" : "TSClassImplements";
      if (expression.type === "TSInstantiationExpression") {
        expression.type = nodeType;
        return expression;
      }
      const node = this.startNodeAtNode(expression);
      node.expression = expression;
      if (this.match(43) || this.match(47)) {
        node.typeArguments = this.tsParseTypeArgumentsInExpression();
      }
      return this.finishNode(node, nodeType);
    });
    if (!delimitedList.length) {
      this.raise(TSErrors.EmptyHeritageClauseType, originalStartLoc, {
        token
      });
    }
    return delimitedList;
  }
  tsParseInterfaceDeclaration(node, properties = {}) {
    if (this.hasFollowingLineBreak()) return null;
    this.expectContextual(125);
    if (properties.declare) node.declare = true;
    if (tokenIsIdentifier(this.state.type)) {
      node.id = this.parseIdentifier();
      this.checkIdentifier(node.id, 130);
    } else {
      node.id = null;
      this.raise(TSErrors.MissingInterfaceName, this.state.startLoc);
    }
    node.typeParameters = this.tsTryParseTypeParameters(this.tsParseInOutConstModifiers);
    if (this.eat(77)) {
      node.extends = this.tsParseHeritageClause("extends");
    }
    const body = this.startNode();
    body.body = this.tsInType(this.tsParseObjectTypeMembers.bind(this));
    node.body = this.finishNode(body, "TSInterfaceBody");
    return this.finishNode(node, "TSInterfaceDeclaration");
  }
  tsParseTypeAliasDeclaration(node) {
    node.id = this.parseIdentifier();
    this.checkIdentifier(node.id, 2);
    node.typeAnnotation = this.tsInType(() => {
      node.typeParameters = this.tsTryParseTypeParameters(this.tsParseInOutModifiers);
      this.expect(25);
      if (this.isContextual(110) && this.lookaheadCharCode() !== 46) {
        const node2 = this.startNode();
        this.next();
        return this.finishNode(node2, "TSIntrinsicKeyword");
      }
      return this.tsParseType();
    });
    this.semicolon();
    return this.finishNode(node, "TSTypeAliasDeclaration");
  }
  tsInTopLevelContext(cb) {
    if (this.curContext() !== types.brace) {
      const oldContext = this.state.context;
      this.state.context = [oldContext[0]];
      try {
        return cb();
      } finally {
        this.state.context = oldContext;
      }
    } else {
      return cb();
    }
  }
  tsInType(cb) {
    const oldInType = this.state.inType;
    this.state.inType = true;
    try {
      return cb();
    } finally {
      this.state.inType = oldInType;
    }
  }
  tsInDisallowConditionalTypesContext(cb) {
    const oldInDisallowConditionalTypesContext = this.state.inDisallowConditionalTypesContext;
    this.state.inDisallowConditionalTypesContext = true;
    try {
      return cb();
    } finally {
      this.state.inDisallowConditionalTypesContext = oldInDisallowConditionalTypesContext;
    }
  }
  tsInAllowConditionalTypesContext(cb) {
    const oldInDisallowConditionalTypesContext = this.state.inDisallowConditionalTypesContext;
    this.state.inDisallowConditionalTypesContext = false;
    try {
      return cb();
    } finally {
      this.state.inDisallowConditionalTypesContext = oldInDisallowConditionalTypesContext;
    }
  }
  tsEatThenParseType(token) {
    if (this.match(token)) {
      return this.tsNextThenParseType();
    }
  }
  tsExpectThenParseType(token) {
    return this.tsInType(() => {
      this.expect(token);
      return this.tsParseType();
    });
  }
  tsNextThenParseType() {
    return this.tsInType(() => {
      this.next();
      return this.tsParseType();
    });
  }
  tsParseEnumMember() {
    const node = this.startNode();
    node.id = this.match(130) ? super.parseStringLiteral(this.state.value) : this.parseIdentifier(true);
    if (this.eat(25)) {
      node.initializer = super.parseMaybeAssignAllowIn();
    }
    return this.finishNode(node, "TSEnumMember");
  }
  tsParseEnumDeclaration(node, properties = {}) {
    if (properties.const) node.const = true;
    if (properties.declare) node.declare = true;
    this.expectContextual(122);
    node.id = this.parseIdentifier();
    this.checkIdentifier(node.id, node.const ? 8971 : 8459);
    node.body = this.tsParseEnumBody();
    return this.finishNode(node, "TSEnumDeclaration");
  }
  tsParseEnumBody() {
    const node = this.startNode();
    this.expect(2);
    node.members = this.tsParseDelimitedList("EnumMembers", this.tsParseEnumMember.bind(this));
    this.expect(4);
    return this.finishNode(node, "TSEnumBody");
  }
  tsParseModuleBlock(isGlobal) {
    const node = this.startNode();
    if (!isGlobal) {
      this.scope.enter(0);
    }
    this.expect(2);
    super.parseBlockOrModuleBlockBody(node.body = [], void 0, true, 4);
    if (!isGlobal) {
      this.scope.exit();
    }
    return this.finishNode(node, "TSModuleBlock");
  }
  tsParseNamespaceDeclaration(node) {
    node.id = this.tsParseEntityName(0);
    if (node.id.type === "Identifier") {
      this.checkIdentifier(node.id, 1024);
    }
    this.scope.enter(2048);
    this.prodParam.enter(0);
    node.body = this.tsParseModuleBlock(false);
    this.prodParam.exit();
    this.scope.exit();
    return this.finishNode(node, "TSModuleDeclaration");
  }
  tsParseAmbientExternalModuleDeclaration(node) {
    const isGlobal = this.isContextual(108);
    if (isGlobal) {
      node.kind = "global";
      node.id = this.parseIdentifier();
    } else {
      node.kind = "module";
      const {
        type,
        value
      } = this.state;
      if (type === 130) {
        node.id = super.parseStringLiteral(value);
      } else if (tokenIsIdentifier(type)) {
        this.raise(TSErrors.InlineModuleDeclarationMustUseString, this.state.startLoc);
        node.id = this.tsParseEntityName(0);
      } else if (type === 2) {
        this.raise(TSErrors.EmptyNamespaceName, this.state.startLoc);
      } else {
        this.raise(TSErrors.InvalidNamespaceName, this.state.startLoc, value);
        node.id = super.parseExprAtom();
      }
    }
    if (this.match(2)) {
      if (!isGlobal) {
        this.scope.enter(1024);
      }
      this.prodParam.enter(0);
      node.body = this.tsParseModuleBlock(isGlobal);
      this.prodParam.exit();
      if (!isGlobal) {
        this.scope.exit();
      }
    } else {
      this.semicolon();
    }
    return this.finishNode(node, "TSModuleDeclaration");
  }
  tsParseImportEqualsDeclaration(node, maybeDefaultIdentifier) {
    node.id = maybeDefaultIdentifier || this.parseIdentifier();
    this.checkIdentifier(node.id, 4096);
    this.expect(25);
    const moduleReference = this.tsParseModuleReference();
    if (node.importKind === "type" && moduleReference.type !== "TSExternalModuleReference") {
      this.raise(TSErrors.ImportAliasHasImportType, moduleReference);
    }
    node.moduleReference = moduleReference;
    this.semicolon();
    return this.finishNode(node, "TSImportEqualsDeclaration");
  }
  tsIsExternalModuleReference() {
    return this.isContextual(115) && this.lookaheadCharCode() === 40;
  }
  tsParseModuleReference() {
    return this.tsIsExternalModuleReference() ? this.tsParseExternalModuleReference() : this.tsParseEntityName(0);
  }
  tsParseExternalModuleReference() {
    const node = this.startNode();
    this.expectContextual(115);
    this.expect(6);
    if (!this.match(130)) {
      this.unexpected();
    }
    node.expression = super.parseExprAtom();
    this.expect(7);
    this.sawUnambiguousESM = true;
    return this.finishNode(node, "TSExternalModuleReference");
  }
  tsLookAhead(f) {
    const state = this.state.clone();
    const res = f();
    this.state = state;
    return res;
  }
  tsTryParseAndCatch(f) {
    const result = this.tryParse((abort) => f() || abort());
    if (result.aborted || !result.node) return;
    if (result.error) this.state = result.failState;
    return result.node;
  }
  tsTryParse(f) {
    const state = this.state.clone();
    const result = f();
    if (result !== void 0 && result !== false) {
      return result;
    }
    this.state = state;
  }
  tsTryParseDeclare(node) {
    if (this.isLineTerminator()) {
      return;
    }
    const startType = this.state.type;
    return this.tsInAmbientContext(() => {
      switch (startType) {
        case 64:
          node.declare = true;
          return super.parseFunctionStatement(node, false, false);
        case 76:
          node.declare = true;
          return this.parseClass(node, true, false);
        case 122:
          return this.tsParseEnumDeclaration(node, {
            declare: true
          });
        case 108:
          return this.tsParseAmbientExternalModuleDeclaration(node);
        case 96:
          if (this.state.containsEsc) {
            return;
          }
        case 71:
        case 70:
          if (!this.match(71) || !this.isLookaheadContextual("enum")) {
            node.declare = true;
            return this.parseVarStatement(node, this.state.value, true);
          }
          this.expect(71);
          return this.tsParseEnumDeclaration(node, {
            const: true,
            declare: true
          });
        case 103:
          if (this.isUsing()) {
            this.raise(TSErrors.InvalidModifierOnUsingDeclaration, this.state.startLoc, "declare");
            node.declare = true;
            return this.parseVarStatement(node, "using", true);
          }
          break;
        case 92:
          if (this.isAwaitUsing()) {
            this.raise(TSErrors.InvalidModifierOnAwaitUsingDeclaration, this.state.startLoc, "declare");
            node.declare = true;
            this.next();
            return this.parseVarStatement(node, "await using", true);
          }
          break;
        case 125: {
          const result = this.tsParseInterfaceDeclaration(node, {
            declare: true
          });
          if (result) return result;
        }
        default:
          if (tokenIsIdentifier(startType)) {
            return this.tsParseDeclaration(node, this.state.type, true, null);
          }
      }
    });
  }
  tsTryParseExportDeclaration() {
    return this.tsParseDeclaration(this.startNode(), this.state.type, true, null);
  }
  tsParseDeclaration(node, type, next, decorators) {
    switch (type) {
      case 120:
        if (this.tsCheckLineTerminator(next) && (this.match(76) || tokenIsIdentifier(this.state.type))) {
          return this.tsParseAbstractDeclaration(node, decorators);
        }
        break;
      case 123:
        if (this.tsCheckLineTerminator(next)) {
          return this.tsParseAmbientExternalModuleDeclaration(node);
        }
        break;
      case 124:
        if (this.tsCheckLineTerminator(next) && tokenIsIdentifier(this.state.type)) {
          node.kind = "namespace";
          return this.tsParseNamespaceDeclaration(node);
        }
        break;
      case 126:
        if (this.tsCheckLineTerminator(next) && tokenIsIdentifier(this.state.type)) {
          return this.tsParseTypeAliasDeclaration(node);
        }
        break;
    }
  }
  tsCheckLineTerminator(next) {
    if (next) {
      if (this.hasFollowingLineBreak()) return false;
      this.next();
      return true;
    }
    return !this.isLineTerminator();
  }
  tsTryParseGenericAsyncArrowFunction(startLoc) {
    if (!this.match(43)) return;
    const res = this.tsTryParseAndCatch(() => {
      const node = this.startNodeAt(startLoc);
      node.typeParameters = this.tsParseTypeParameters(this.tsParseConstModifier);
      super.parseFunctionParams(node);
      node.returnType = this.tsTryParseTypeOrTypePredicateAnnotation();
      this.expect(15);
      return node;
    });
    if (!res) return;
    return super.parseArrowExpression(res, null, true);
  }
  tsParseTypeArgumentsInExpression() {
    if (this.reScan_lt() !== 43) return;
    return this.tsParseTypeArguments();
  }
  tsParseTypeArguments() {
    const node = this.startNode();
    node.params = this.tsInType(() => this.tsInTopLevelContext(() => {
      this.expect(43);
      return this.tsParseDelimitedList("TypeParametersOrArguments", this.tsParseType.bind(this));
    }));
    if (node.params.length === 0) {
      this.raise(TSErrors.EmptyTypeArguments, node);
    } else if (!this.state.inType && this.curContext() === types.brace) {
      this.reScan_lt_gt();
    }
    this.expect(44);
    return this.finishNode(node, "TSTypeParameterInstantiation");
  }
  tsIsDeclarationStart() {
    return tokenIsTSDeclarationStart(this.state.type);
  }
  isExportDefaultSpecifier() {
    if (this.tsIsDeclarationStart()) return false;
    return super.isExportDefaultSpecifier();
  }
  parseBindingElement(flags, decorators) {
    const startLoc = decorators.length ? null : this.state.startLoc;
    const modified = {};
    this.tsParseModifiers({
      allowedModifiers: ["public", "private", "protected", "override", "readonly"]
    }, modified);
    const accessibility = modified.accessibility;
    const override = modified.override;
    const readonly = modified.readonly;
    if (!(flags & 4) && (accessibility || readonly || override)) {
      this.raise(TSErrors.UnexpectedParameterModifier, startLoc || decorators[0]);
    }
    const startLoc2 = this.state.startLoc;
    const left = this.parseMaybeDefault(startLoc2);
    if (flags & 2) {
      this.parseFunctionParamType(left);
    }
    const elt = this.parseMaybeDefault(startLoc2, left);
    if (accessibility || readonly || override) {
      const pp = startLoc ? this.startNodeAt(startLoc) : this.startNodeAtNode(decorators[0]);
      if (decorators.length) {
        pp.decorators = decorators;
      } else {
        this.setLoc(startLoc);
      }
      if (accessibility) pp.accessibility = accessibility;
      if (readonly) pp.readonly = readonly;
      if (override) pp.override = override;
      if (elt.type !== "Identifier" && elt.type !== "AssignmentPattern") {
        this.raise(TSErrors.UnsupportedParameterPropertyKind, startLoc || decorators[0]);
      }
      pp.parameter = elt;
      return this.finishNode(pp, "TSParameterProperty");
    }
    if (decorators.length) {
      left.decorators = decorators;
    }
    return elt;
  }
  isSimpleParameter(node) {
    return node.type === "TSParameterProperty" && super.isSimpleParameter(node.parameter) || super.isSimpleParameter(node);
  }
  tsDisallowOptionalPattern(node) {
    for (const param of node.params) {
      if (param.type !== "Identifier" && param.optional && !this.state.isAmbientContext) {
        this.raise(TSErrors.PatternIsOptional, param);
      }
    }
  }
  setArrowFunctionParameters(node, params, trailingCommaLoc) {
    super.setArrowFunctionParameters(node, params, trailingCommaLoc);
    this.tsDisallowOptionalPattern(node);
  }
  parseFunctionBodyAndFinish(node, type, isMethod = false) {
    if (this.match(10)) {
      node.returnType = this.tsParseTypeOrTypePredicateAnnotation(10);
    }
    const bodilessType = type === "FunctionDeclaration" ? "TSDeclareFunction" : type === "ClassMethod" || type === "ClassPrivateMethod" ? "TSDeclareMethod" : void 0;
    if (bodilessType && !this.match(2) && this.isLineTerminator()) {
      if (bodilessType === "TSDeclareMethod" && node.kind === "constructor") {
        for (const param of node.params) {
          if (param.type === "TSParameterProperty") {
            this.raise(TSErrors.UnexpectedParameterModifier, param);
          } else if (param.type === "AssignmentPattern") {
            this.raise(TSErrors.UnexpectedParameterInitializer, param);
          }
        }
      } else {
        for (const param of node.params) {
          if (param.type === "AssignmentPattern") {
            this.raise(TSErrors.UnexpectedParameterInitializer, param);
          }
        }
      }
      return this.finishNode(node, bodilessType);
    }
    if (bodilessType && this.state.isAmbientContext) {
      this.raise(TSErrors.DeclareFunctionHasImplementation, this.state.startLoc);
      if (bodilessType === "TSDeclareFunction" && node.declare) {
        return super.parseFunctionBodyAndFinish(node, bodilessType, isMethod);
      }
    }
    this.tsDisallowOptionalPattern(node);
    return super.parseFunctionBodyAndFinish(node, type, isMethod);
  }
  registerFunctionStatementId(node) {
    if (!node.body && node.id) {
      this.checkIdentifier(node.id, 1024);
    } else {
      super.registerFunctionStatementId(node);
    }
  }
  tsCheckForInvalidTypeCasts(items) {
    items.forEach((node) => {
      if (node?.type === "TSTypeCastExpression") {
        this.raise(TSErrors.UnexpectedTypeAnnotation, node.typeAnnotation);
      }
    });
  }
  toReferencedList(exprList, isInParens) {
    this.tsCheckForInvalidTypeCasts(exprList);
    return exprList;
  }
  parseArrayLike(close, refExpressionErrors) {
    const node = super.parseArrayLike(close, refExpressionErrors);
    if (node.type === "ArrayExpression") {
      this.tsCheckForInvalidTypeCasts(node.elements);
    }
    return node;
  }
  parseSubscript(base, startLoc, noCalls, state) {
    if (!this.hasPrecedingLineBreak() && this.match(31)) {
      this.state.canStartJSXElement = false;
      this.next();
      const nonNullExpression = this.startNodeAt(startLoc);
      nonNullExpression.expression = base;
      return this.finishNode(nonNullExpression, "TSNonNullExpression");
    }
    let isOptionalCall = false;
    if (this.match(14) && this.lookaheadCharCode() === 60) {
      if (noCalls) {
        state.stop = true;
        return base;
      }
      state.optionalChainMember = isOptionalCall = true;
      this.next();
    }
    if (this.match(43) || this.match(47)) {
      let missingParenErrorLoc;
      const result = this.tsTryParseAndCatch(() => {
        if (!noCalls && this.atPossibleAsyncArrow(base)) {
          const asyncArrowFn = this.tsTryParseGenericAsyncArrowFunction(startLoc);
          if (asyncArrowFn) {
            state.stop = true;
            return asyncArrowFn;
          }
        }
        const typeArguments = this.tsParseTypeArgumentsInExpression();
        if (!typeArguments) return;
        if (isOptionalCall && !this.match(6)) {
          missingParenErrorLoc = this.state.curPosition();
          return;
        }
        if (tokenIsTemplate(this.state.type)) {
          const result2 = super.parseTaggedTemplateExpression(base, startLoc, state);
          result2.typeArguments = typeArguments;
          return result2;
        }
        if (!noCalls && this.eat(6)) {
          const node2 = this.startNodeAt(startLoc);
          node2.callee = base;
          node2.arguments = this.parseCallExpressionArguments();
          this.tsCheckForInvalidTypeCasts(node2.arguments);
          node2.typeArguments = typeArguments;
          if (state.optionalChainMember) {
            node2.optional = isOptionalCall;
          }
          return this.finishCallExpression(node2, state.optionalChainMember);
        }
        const tokenType = this.state.type;
        if (tokenType === 44 || tokenType === 48 || tokenType !== 6 && tokenType !== 89 && tokenType !== 116 && tokenCanStartExpression(tokenType) && !this.hasPrecedingLineBreak()) {
          return;
        }
        const node = this.startNodeAt(startLoc);
        node.expression = base;
        node.typeArguments = typeArguments;
        return this.finishNode(node, "TSInstantiationExpression");
      });
      if (missingParenErrorLoc) {
        this.unexpected(missingParenErrorLoc, 6);
      }
      if (result) {
        if (result.type === "TSInstantiationExpression") {
          if (this.match(12) || this.match(14) && this.lookaheadCharCode() !== 40) {
            this.raise(TSErrors.InvalidPropertyAccessAfterInstantiationExpression, this.state.startLoc);
          }
          if (!this.match(12) && !this.match(14)) {
            result.expression = super.stopParseSubscript(base, state);
          }
        }
        return result;
      }
    }
    return super.parseSubscript(base, startLoc, noCalls, state);
  }
  parseNewCallee(node) {
    super.parseNewCallee(node);
    const {
      callee
    } = node;
    if (callee.type === "TSInstantiationExpression" && !callee.extra?.parenthesized) {
      node.typeArguments = callee.typeArguments;
      node.callee = callee.expression;
    }
  }
  parseExprOp(left, leftStartLoc, minPrec) {
    let isSatisfies;
    if (tokenOperatorPrecedence(54) > minPrec && !this.hasPrecedingLineBreak() && (this.isContextual(89) || (isSatisfies = this.isContextual(116)))) {
      const node = this.startNodeAt(leftStartLoc);
      node.expression = left;
      node.typeAnnotation = this.tsInType(() => {
        this.next();
        if (this.match(71)) {
          if (isSatisfies) {
            this.raise(Errors.UnexpectedKeyword, this.state.startLoc, {
              keyword: "const"
            });
          }
          return this.tsParseTypeReference();
        }
        return this.tsParseType();
      });
      const result = this.finishNode(node, isSatisfies ? "TSSatisfiesExpression" : "TSAsExpression");
      this.reScan_lt_gt();
      return this.parseExprOp(result, leftStartLoc, minPrec);
    }
    return super.parseExprOp(left, leftStartLoc, minPrec);
  }
  checkReservedWord(word, startLoc, checkKeywords, isBinding) {
    if (!this.state.isAmbientContext) {
      super.checkReservedWord(word, startLoc, checkKeywords, isBinding);
    }
  }
  checkDuplicateExports() {
  }
  isPotentialImportPhase(isExport) {
    if (super.isPotentialImportPhase(isExport)) return true;
    if (this.isContextual(126)) {
      const ch = this.lookaheadCharCode();
      return isExport ? ch === 123 || ch === 42 : ch !== 61;
    }
    return !isExport && this.isContextual(83);
  }
  applyImportPhase(node, isExport, phase, loc) {
    super.applyImportPhase(node, isExport, phase, loc);
    if (isExport) {
      node.exportKind = phase === "type" ? "type" : "value";
    } else {
      node.importKind = phase === "type" || phase === "typeof" ? phase : "value";
    }
  }
  parseImport(node) {
    if (this.match(130)) {
      node.importKind = "value";
      if (this.scope.inTSNamespace) {
        this.raise(TSErrors.ImportInTSNamespace, node);
      }
      return super.parseImport(node);
    }
    let importNode;
    if (tokenIsIdentifier(this.state.type) && this.lookaheadCharCode() === 61) {
      node.importKind = "value";
      const result = this.tsParseImportEqualsDeclaration(node);
      if (this.scope.inTSNamespace && result.moduleReference.type === "TSExternalModuleReference") {
        this.raise(TSErrors.ImportInTSNamespace, node);
      }
      return result;
    } else if (this.isContextual(126)) {
      const maybeDefaultIdentifier = this.parseMaybeImportPhase(node, false);
      if (this.lookaheadCharCode() === 61) {
        if (this.scope.inTSNamespace) {
          this.raise(TSErrors.ImportInTSNamespace, node);
        }
        return this.tsParseImportEqualsDeclaration(node, maybeDefaultIdentifier);
      } else {
        importNode = super.parseImportSpecifiersAndAfter(node, maybeDefaultIdentifier);
      }
    } else {
      importNode = super.parseImport(node);
    }
    if (importNode.importKind === "type" && importNode.specifiers.length > 1 && importNode.specifiers[0].type === "ImportDefaultSpecifier") {
      this.raise(TSErrors.TypeImportCannotSpecifyDefaultAndNamed, importNode);
    } else if (this.scope.inTSNamespace) {
      this.raise(TSErrors.ImportInTSNamespace, importNode);
    }
    return importNode;
  }
  parseExport(node, decorators) {
    if (this.match(79)) {
      const nodeImportEquals = this.startNode();
      this.next();
      let maybeDefaultIdentifier = null;
      if (this.isContextual(126) && this.isPotentialImportPhase(false)) {
        maybeDefaultIdentifier = this.parseMaybeImportPhase(nodeImportEquals, false);
      } else {
        nodeImportEquals.importKind = "value";
      }
      const declaration = this.tsParseImportEqualsDeclaration(nodeImportEquals, maybeDefaultIdentifier);
      node.attributes = [];
      node.declaration = declaration;
      node.exportKind = "value";
      node.source = null;
      node.specifiers = [];
      return this.finishNode(node, "ExportNamedDeclaration");
    } else if (this.eat(25)) {
      const assign = node;
      assign.expression = super.parseExpression();
      this.semicolon();
      this.sawUnambiguousESM = true;
      if (this.scope.inTSNamespace) {
        this.raise(TSErrors.ExportAssignmentInTSNamespace, assign);
      }
      return this.finishNode(assign, "TSExportAssignment");
    } else if (this.eatContextual(89)) {
      const decl = node;
      this.expectContextual(124);
      decl.id = this.parseIdentifier();
      this.checkIdentifier(decl.id, 8201);
      this.semicolon();
      if (this.scope.inTSNamespace) {
        this.raise(TSErrors.NamespaceExportInTSNamespace, decl);
      }
      return this.finishNode(decl, "TSNamespaceExportDeclaration");
    } else {
      const result = super.parseExport(node, decorators);
      if (this.scope.inTSNamespace && (result.type !== "ExportNamedDeclaration" || result.source || !result.declaration && !this.state.isAmbientContext)) {
        this.raise(TSErrors.ExportInTSNamespace, result);
      }
      return result;
    }
  }
  isAbstractClass() {
    return this.isContextual(120) && this.isLookaheadContextual("class");
  }
  parseExportDefaultExpression() {
    if (this.isAbstractClass()) {
      const cls = this.startNode();
      this.next();
      cls.abstract = true;
      return this.parseClass(cls, true, true);
    }
    if (this.match(125)) {
      const result = this.tsParseInterfaceDeclaration(this.startNode());
      if (result) return result;
    }
    return super.parseExportDefaultExpression();
  }
  parseVarStatement(node, kind, allowMissingInitializer = false) {
    const {
      isAmbientContext
    } = this.state;
    const declaration = super.parseVarStatement(node, kind, allowMissingInitializer || isAmbientContext);
    if (isAmbientContext && !node.declare && (kind === "using" || kind === "await using")) {
      this.raiseOverwrite(TSErrors.UsingDeclarationInAmbientContext, node, kind);
      return declaration;
    }
    for (const declarator of declaration.declarations) {
      const {
        id,
        init,
        definite
      } = declarator;
      if (definite) {
        if (init) {
          this.raise(TSErrors.DeclaratorDefiniteAssertionWithInitializer, id);
        } else if (!id.typeAnnotation) {
          this.raise(TSErrors.DeclaratorDefiniteAssertionRequiresTypeAnnotation, id);
        }
      }
      if (isAmbientContext && init) {
        if (kind === "var" || kind === "let" || !!id.typeAnnotation) {
          this.raise(TSErrors.InitializerNotAllowedInAmbientContext, init);
        } else if (!isValidAmbientConstInitializer(init, this.hasPlugin("estree"))) {
          this.raise(TSErrors.ConstInitializerMustBeStringOrNumericLiteralOrLiteralEnumReference, init);
        }
      }
    }
    return declaration;
  }
  parseStatementContent(flags, decorators) {
    const allowDeclaration = !!(flags & 2);
    if (!this.state.containsEsc) {
      switch (this.state.type) {
        case 71: {
          if (this.isLookaheadContextual("enum")) {
            const node = this.startNode();
            this.next();
            return this.tsParseEnumDeclaration(node, {
              const: true
            });
          }
          break;
        }
        case 120:
        case 121: {
          if (this.nextTokenIsIdentifierAndNotTSRelationalOperatorOnSameLine()) {
            const token = this.state.type;
            const node = this.startNode();
            this.next();
            const declaration = token === 121 ? this.tsTryParseDeclare(node) : this.tsParseAbstractDeclaration(node, decorators);
            if (declaration) {
              if (token === 121) {
                declaration.declare = true;
              }
              return declaration;
            } else {
              node.expression = this.createIdentifier(this.startNodeAtNode(node), token === 121 ? "declare" : "abstract");
              this.semicolon(false);
              return this.finishNode(node, "ExpressionStatement");
            }
          }
          break;
        }
        case 122:
          return this.tsParseEnumDeclaration(this.startNode());
        case 108: {
          const nextCh = this.lookaheadCharCode();
          if (nextCh === 123) {
            const node = this.startNode();
            return this.tsParseAmbientExternalModuleDeclaration(node);
          }
          break;
        }
        case 125: {
          const result = this.tsParseInterfaceDeclaration(this.startNode());
          if (result) {
            if (!allowDeclaration) {
              this.raise(TSErrors.UnexpectedTypeDeclaration, result, "interface");
            }
            return result;
          }
          break;
        }
        case 123: {
          if (this.nextTokenIsStringLiteralOnSameLine()) {
            const node = this.startNode();
            this.next();
            return this.tsParseDeclaration(node, 123, false, decorators);
          } else if (this.nextTokenIsIdentifierOnSameLine()) {
            this.raise(TSErrors.InlineModuleDeclarationMustUseString, this.state.startLoc);
            const node = this.startNode();
            this.next();
            return this.tsParseDeclaration(node, 124, false, decorators);
          }
          break;
        }
        case 124: {
          if (this.nextTokenIsIdentifierOnSameLine()) {
            const node = this.startNode();
            this.next();
            return this.tsParseDeclaration(node, 124, false, decorators);
          }
          break;
        }
        case 126: {
          if (this.nextTokenIsIdentifierOnSameLine()) {
            const node = this.startNode();
            if (!allowDeclaration) {
              this.raise(TSErrors.UnexpectedTypeDeclaration, node, "type");
            }
            this.next();
            return this.tsParseTypeAliasDeclaration(node);
          }
          break;
        }
      }
    }
    return super.parseStatementContent(flags, decorators);
  }
  parseAccessModifier() {
    return this.tsParseModifier(["public", "protected", "private"]);
  }
  tsHasSomeModifiers(member, modifiers) {
    return modifiers.some((modifier) => {
      if (tsIsAccessModifier(modifier)) {
        return member.accessibility === modifier;
      }
      return !!member[modifier];
    });
  }
  tsIsStartOfStaticBlocks() {
    return this.isContextual(102) && this.lookaheadCharCode() === 123;
  }
  parseClassMember(classBody, member, state) {
    const modifiers = ["declare", "private", "public", "protected", "override", "abstract", "readonly", "static"];
    this.tsParseModifiers({
      allowedModifiers: modifiers,
      disallowedModifiers: ["in", "out"],
      stopOnStartOfClassStaticBlock: true,
      errorTemplate: TSErrors.InvalidModifierOnTypeParameterPositions
    }, member);
    const callParseClassMemberWithIsStatic = () => {
      if (this.tsIsStartOfStaticBlocks()) {
        this.next();
        this.next();
        if (this.tsHasSomeModifiers(member, modifiers)) {
          this.raise(TSErrors.StaticBlockCannotHaveModifier, this.state.curPosition());
        }
        super.parseClassStaticBlock(classBody, member);
      } else {
        this.parseClassMemberWithIsStatic(classBody, member, state, !!member.static);
      }
    };
    if (member.declare) {
      this.tsInAmbientContext(callParseClassMemberWithIsStatic);
    } else {
      callParseClassMemberWithIsStatic();
    }
    if (member.decorators && member.decorators.length > 0 && !this.hasPlugin("decorators-legacy")) {
      if (member.type === "TSAbstractMethodDefinition" || member.type === "TSDeclareMethod") {
        this.raise(TSErrors.DecoratorAbstractMethod, member, {
          kind: "abstract method"
        });
      } else if (member.type === "ClassProperty" && member.abstract || member.type === "ClassProperty" && member.declare || member.type === "TSAbstractPropertyDefinition" || member.type === "PropertyDefinition" && member.declare) {
        this.raise(TSErrors.DecoratorAbstractMethod, member, {
          kind: member.declare ? "declare field" : "abstract field"
        });
      }
    }
  }
  parseClassMemberWithIsStatic(classBody, member, state, isStatic) {
    const idx = this.tsTryParseIndexSignature(member);
    if (idx) {
      classBody.body.push(idx);
      if (member.abstract) {
        this.raise(TSErrors.IndexSignatureHasAbstract, member);
      }
      if (member.accessibility) {
        this.raise(TSErrors.IndexSignatureHasAccessibility, member, {
          modifier: member.accessibility
        });
      }
      if (member.declare) {
        this.raise(TSErrors.IndexSignatureHasDeclare, member);
      }
      if (member.override) {
        this.raise(TSErrors.IndexSignatureHasOverride, member);
      }
      return;
    }
    if (!this.state.inAbstractClass && member.abstract) {
      this.raise(TSErrors.NonAbstractClassHasAbstractMethod, member);
    }
    if (member.override) {
      if (!state.hadSuperClass) {
        this.raise(TSErrors.OverrideNotInSubClass, member);
      }
    }
    super.parseClassMemberWithIsStatic(classBody, member, state, isStatic);
  }
  parsePostMemberNameModifiers(methodOrProp) {
    const optional = this.eat(13);
    if (optional) methodOrProp.optional = true;
    if (methodOrProp.readonly && this.match(6)) {
      this.raise(TSErrors.ClassMethodHasReadonly, methodOrProp);
    }
    if (methodOrProp.declare && this.match(6)) {
      this.raise(TSErrors.ClassMethodHasDeclare, methodOrProp);
    }
  }
  shouldParseExportDeclaration() {
    if (this.tsIsDeclarationStart()) return true;
    return super.shouldParseExportDeclaration();
  }
  parseConditional(expr, startLoc, refExpressionErrors) {
    if (!this.match(13)) return expr;
    if (refExpressionErrors != null) {
      const nextCh = this.lookaheadCharCode();
      if (nextCh === 44 || nextCh === 61 || nextCh === 58 || nextCh === 41) {
        this.setOptionalParametersError(refExpressionErrors);
        return expr;
      }
    }
    this.next();
    const node = this.startNodeAt(startLoc);
    node.test = expr;
    const oldInConditionalConsequent = this.state.inConditionalConsequent;
    this.state.inConditionalConsequent = true;
    node.consequent = this.parseMaybeAssignAllowIn();
    this.state.inConditionalConsequent = oldInConditionalConsequent;
    this.expect(10);
    node.alternate = this.parseMaybeAssign();
    return this.finishNode(node, "ConditionalExpression");
  }
  parseParenItem(node, startLoc) {
    const newNode = super.parseParenItem(node, startLoc);
    if (this.eat(13)) {
      newNode.optional = true;
      this.resetEndLocation(node);
    }
    if (this.match(10)) {
      const typeCastNode = this.startNodeAt(startLoc);
      typeCastNode.expression = node;
      typeCastNode.typeAnnotation = this.tsParseTypeAnnotation();
      return this.finishNode(typeCastNode, "TSTypeCastExpression");
    }
    return node;
  }
  parseExportDeclaration(node) {
    if (!this.state.isAmbientContext && this.isContextual(121)) {
      return this.tsInAmbientContext(() => this.parseExportDeclaration(node));
    }
    const startLoc = this.state.startLoc;
    const isDeclare = this.eatContextual(121);
    if (isDeclare && (this.isContextual(121) || !this.shouldParseExportDeclaration())) {
      throw this.raise(TSErrors.ExpectedAmbientAfterExportDeclare, this.state.startLoc);
    }
    const isIdentifier = tokenIsIdentifier(this.state.type);
    const declaration = isIdentifier && this.tsTryParseExportDeclaration() || super.parseExportDeclaration(node);
    if (!declaration) return null;
    if (declaration.type === "TSInterfaceDeclaration" || declaration.type === "TSTypeAliasDeclaration" || isDeclare) {
      node.exportKind = "type";
    }
    if (isDeclare && declaration.type !== "TSImportEqualsDeclaration") {
      this.resetStartLocation(declaration, startLoc);
      declaration.declare = true;
    }
    return declaration;
  }
  parseClassId(node, isStatement, optionalId, bindingType) {
    if ((!isStatement || optionalId) && this.isContextual(109)) {
      node.id = null;
      return;
    }
    super.parseClassId(node, isStatement, optionalId, node.declare ? 1024 : 8331);
    const typeParameters = this.tsTryParseTypeParameters(this.tsParseInOutConstModifiers);
    if (typeParameters) node.typeParameters = typeParameters;
  }
  parseClassPropertyAnnotation(node) {
    if (!node.optional) {
      if (this.eat(31)) {
        node.definite = true;
      } else if (this.eat(13)) {
        node.optional = true;
      }
    }
    const type = this.tsTryParseTypeAnnotation();
    if (type) node.typeAnnotation = type;
    if (node.definite) {
      if (this.match(25)) {
        this.raise(TSErrors.DeclaratorDefiniteAssertionWithInitializer, node);
      } else if (!type) {
        this.raise(TSErrors.DeclaratorDefiniteAssertionRequiresTypeAnnotation, node);
      }
    }
  }
  parseClassProperty(node) {
    this.parseClassPropertyAnnotation(node);
    if (this.state.isAmbientContext && !(node.readonly && !node.typeAnnotation) && this.match(25)) {
      this.raise(TSErrors.DeclareClassFieldHasInitializer, this.state.startLoc);
    }
    if (node.abstract && this.match(25)) {
      const {
        key
      } = node;
      this.raise(TSErrors.AbstractPropertyHasInitializer, this.state.startLoc, {
        propertyName: key.type === "Identifier" && !node.computed ? key.name : `[${this.input.slice(this.offsetToSourcePos(key.start), this.offsetToSourcePos(key.end))}]`
      });
    }
    return super.parseClassProperty(node);
  }
  parseClassPrivateProperty(node) {
    if (node.abstract) {
      this.raise(TSErrors.PrivateElementHasAbstract, node);
    }
    if (node.accessibility) {
      this.raise(TSErrors.PrivateElementHasAccessibility, node, {
        modifier: node.accessibility
      });
    }
    this.parseClassPropertyAnnotation(node);
    return super.parseClassPrivateProperty(node);
  }
  parseClassAccessorProperty(node) {
    this.parseClassPropertyAnnotation(node);
    if (node.optional) {
      this.raise(TSErrors.AccessorCannotBeOptional, node);
    }
    return super.parseClassAccessorProperty(node);
  }
  pushClassMethod(classBody, method, isGenerator, isAsync, isConstructor, allowsDirectSuper) {
    const typeParameters = this.tsTryParseTypeParameters(this.tsParseConstModifier);
    if (typeParameters && isConstructor) {
      this.raise(TSErrors.ConstructorHasTypeParameters, typeParameters);
    }
    const {
      declare = false,
      kind
    } = method;
    if (declare && (kind === "get" || kind === "set")) {
      this.raise(TSErrors.DeclareAccessor, method, {
        kind
      });
    }
    if (typeParameters) method.typeParameters = typeParameters;
    super.pushClassMethod(classBody, method, isGenerator, isAsync, isConstructor, allowsDirectSuper);
  }
  pushClassPrivateMethod(classBody, method, isGenerator, isAsync) {
    const typeParameters = this.tsTryParseTypeParameters(this.tsParseConstModifier);
    if (typeParameters) method.typeParameters = typeParameters;
    super.pushClassPrivateMethod(classBody, method, isGenerator, isAsync);
  }
  declareClassPrivateMethodInScope(node, kind) {
    if (node.type === "TSDeclareMethod") return;
    if (node.type === "MethodDefinition" && node.value.body == null) {
      return;
    }
    super.declareClassPrivateMethodInScope(node, kind);
  }
  parseClassSuper(node) {
    super.parseClassSuper(node);
    if (node.superClass) {
      if (node.superClass.type === "TSInstantiationExpression") {
        const tsInstantiationExpression = node.superClass;
        const superClass2 = tsInstantiationExpression.expression;
        this.takeSurroundingComments(superClass2, superClass2.start, superClass2.end);
        const superTypeArguments = tsInstantiationExpression.typeArguments;
        this.takeSurroundingComments(superTypeArguments, superTypeArguments.start, superTypeArguments.end);
        node.superClass = superClass2;
        node.superTypeArguments = superTypeArguments;
      } else if (this.match(43) || this.match(47)) {
        node.superTypeArguments = this.tsParseTypeArgumentsInExpression();
      }
    }
    if (this.eatContextual(109)) {
      node.implements = this.tsParseHeritageClause("implements");
    }
  }
  parseObjPropValue(prop, startLoc, isGenerator, isAsync, isPattern, isAccessor, refExpressionErrors) {
    const typeParameters = this.tsTryParseTypeParameters(this.tsParseConstModifier);
    if (typeParameters) prop.typeParameters = typeParameters;
    return super.parseObjPropValue(prop, startLoc, isGenerator, isAsync, isPattern, isAccessor, refExpressionErrors);
  }
  parseFunctionParams(node, isConstructor) {
    const typeParameters = this.tsTryParseTypeParameters(this.tsParseConstModifier);
    if (typeParameters) node.typeParameters = typeParameters;
    super.parseFunctionParams(node, isConstructor);
  }
  parseVarId(decl, kind) {
    super.parseVarId(decl, kind);
    if (decl.id.type === "Identifier" && !this.hasPrecedingLineBreak() && this.eat(31)) {
      decl.definite = true;
    }
    const type = this.tsTryParseTypeAnnotation();
    if (type) {
      decl.id.typeAnnotation = type;
      this.resetEndLocation(decl.id);
    }
  }
  parseAsyncArrowFromCallExpression(node, call) {
    if (this.match(10)) {
      node.returnType = this.tsParseTypeAnnotation();
    }
    return super.parseAsyncArrowFromCallExpression(node, call);
  }
  parseMaybeAssign(refExpressionErrors, afterLeftParse) {
    let state;
    let jsx2;
    let typeCast;
    if (this.hasPlugin("jsx") && (this.match(138) || this.match(43))) {
      state = this.state.clone();
      jsx2 = this.tryParse(() => super.parseMaybeAssign(refExpressionErrors, afterLeftParse), state);
      if (!jsx2.error) return jsx2.node;
      const {
        context
      } = this.state;
      const currentContext = context[context.length - 1];
      if (currentContext === types.j_oTag || currentContext === types.j_expr) {
        context.pop();
      }
    }
    if (!jsx2?.error && !this.match(43)) {
      return super.parseMaybeAssign(refExpressionErrors, afterLeftParse);
    }
    if (!state || state === this.state) state = this.state.clone();
    let typeParameters;
    const arrow = this.tryParse((abort) => {
      typeParameters = this.tsParseTypeParameters(this.tsParseConstModifier);
      const expr = super.parseMaybeAssign(refExpressionErrors, afterLeftParse);
      if (expr.type !== "ArrowFunctionExpression" || expr.extra?.parenthesized) {
        abort();
      }
      if (typeParameters?.params.length !== 0) {
        this.resetStartLocationFromNode(expr, typeParameters);
      }
      expr.typeParameters = typeParameters;
      if (this.hasPlugin("jsx") && expr.typeParameters.params.length === 1 && !expr.typeParameters.extra?.trailingComma) {
        const parameter = expr.typeParameters.params[0];
        if (!parameter.constraint) {
          this.raise(TSErrors.SingleTypeParameterWithoutTrailingComma, this.optionFlags & 256 ? createPositionWithColumnOffset(parameter.loc.end, 1) : parameter, {
            typeParameterName: parameter.name.name
          });
        }
      }
      return expr;
    }, state);
    if (!arrow.error && !arrow.aborted) {
      if (typeParameters) this.reportReservedArrowTypeParam(typeParameters);
      return arrow.node;
    }
    if (!jsx2) {
      assert(!this.hasPlugin("jsx"));
      typeCast = this.tryParse(() => super.parseMaybeAssign(refExpressionErrors, afterLeftParse), state);
      if (!typeCast.error) return typeCast.node;
    }
    if (jsx2?.node) {
      this.state = jsx2.failState;
      return jsx2.node;
    }
    if (arrow.node) {
      this.state = arrow.failState;
      if (typeParameters) this.reportReservedArrowTypeParam(typeParameters);
      return arrow.node;
    }
    if (typeCast?.node) {
      this.state = typeCast.failState;
      return typeCast.node;
    }
    throw jsx2?.error || arrow.error || typeCast?.error;
  }
  reportReservedArrowTypeParam(node) {
    if (node.params.length === 1 && !node.params[0].constraint && !node.extra?.trailingComma && this.getPluginOption("typescript", "disallowAmbiguousJSXLike")) {
      this.raise(TSErrors.ReservedArrowTypeParam, node);
    }
  }
  parseMaybeUnary(refExpressionErrors, sawUnary) {
    if (!this.hasPlugin("jsx") && this.match(43)) {
      return this.tsParseTypeAssertion();
    }
    return super.parseMaybeUnary(refExpressionErrors, sawUnary);
  }
  parseArrow(node) {
    if (this.match(10)) {
      const result = this.tryParse((abort) => {
        const returnType = this.tsParseTypeOrTypePredicateAnnotation(10);
        if (this.canInsertSemicolon() || !this.match(15)) abort();
        return returnType;
      });
      if (result.aborted) return;
      if (!result.thrown) {
        if (result.error) this.state = result.failState;
        node.returnType = result.node;
      }
    }
    return super.parseArrow(node);
  }
  parseFunctionParamType(param) {
    if (this.eat(13)) {
      param.optional = true;
    }
    const type = this.tsTryParseTypeAnnotation();
    if (type) param.typeAnnotation = type;
    this.resetEndLocation(param);
    return param;
  }
  isAssignable(node, isBinding) {
    switch (node.type) {
      case "TSTypeCastExpression":
        return this.isAssignable(node.expression, isBinding);
      case "TSParameterProperty":
        return true;
      default:
        return super.isAssignable(node, isBinding);
    }
  }
  toAssignable(node, isLHS = false) {
    switch (node.type) {
      case "ParenthesizedExpression":
        this.toAssignableParenthesizedExpression(node, isLHS);
        break;
      case "TSAsExpression":
      case "TSSatisfiesExpression":
      case "TSNonNullExpression":
      case "TSTypeAssertion":
        if (isLHS) {
          this.expressionScope.recordArrowParameterBindingError(TSErrors.UnexpectedTypeCastInParameter, node);
        } else {
          this.raise(TSErrors.UnexpectedTypeCastInParameter, node);
        }
        this.toAssignable(node.expression, isLHS);
        break;
      case "AssignmentExpression":
        if (!isLHS && node.left.type === "TSTypeCastExpression") {
          node.left = this.typeCastToParameter(node.left);
        }
      default:
        super.toAssignable(node, isLHS);
    }
  }
  toAssignableParenthesizedExpression(node, isLHS) {
    switch (node.expression.type) {
      case "TSAsExpression":
      case "TSSatisfiesExpression":
      case "TSNonNullExpression":
      case "TSTypeAssertion":
      case "ParenthesizedExpression":
        this.toAssignable(node.expression, isLHS);
        break;
      default:
        super.toAssignable(node, isLHS);
    }
  }
  checkToRestConversion(node, allowPattern) {
    switch (node.type) {
      case "TSAsExpression":
      case "TSSatisfiesExpression":
      case "TSTypeAssertion":
      case "TSNonNullExpression":
        this.checkToRestConversion(node.expression, false);
        break;
      default:
        super.checkToRestConversion(node, allowPattern);
    }
  }
  isValidLVal(type, disallowCallExpression, isUnparenthesizedInAssign, binding) {
    switch (type) {
      case "TSTypeCastExpression":
        return true;
      case "TSParameterProperty":
        return "parameter";
      case "TSNonNullExpression":
        return "expression";
      case "TSAsExpression":
      case "TSSatisfiesExpression":
      case "TSTypeAssertion":
        return (binding !== 64 || !isUnparenthesizedInAssign) && ["expression", true];
      default:
        return super.isValidLVal(type, disallowCallExpression, isUnparenthesizedInAssign, binding);
    }
  }
  parseBindingAtom() {
    if (this.state.type === 74) {
      return this.parseIdentifier(true);
    }
    return super.parseBindingAtom();
  }
  parseMaybeDecoratorArguments(expr, startLoc) {
    if (this.match(43) || this.match(47)) {
      const typeArguments = this.tsParseTypeArgumentsInExpression();
      if (this.match(6)) {
        const call = super.parseMaybeDecoratorArguments(expr, startLoc);
        call.typeArguments = typeArguments;
        return call;
      }
      this.unexpected(null, 6);
    }
    return super.parseMaybeDecoratorArguments(expr, startLoc);
  }
  checkCommaAfterRest(close) {
    if (this.state.isAmbientContext && this.match(8) && this.lookaheadCharCode() === close) {
      this.next();
      return false;
    }
    return super.checkCommaAfterRest(close);
  }
  isClassMethod() {
    return this.match(43) || super.isClassMethod();
  }
  isClassProperty() {
    return this.match(31) || this.match(10) || super.isClassProperty();
  }
  parseMaybeDefault(startLoc, left) {
    const node = super.parseMaybeDefault(startLoc, left);
    if (node.type === "AssignmentPattern" && node.typeAnnotation && node.right.start < node.typeAnnotation.start) {
      this.raise(TSErrors.TypeAnnotationAfterAssign, node.typeAnnotation);
    }
    return node;
  }
  getTokenFromCode(code2) {
    if (this.state.inType) {
      if (code2 === 62) {
        this.finishOp(44, 1);
        return;
      }
      if (code2 === 60) {
        this.finishOp(43, 1);
        return;
      }
    }
    super.getTokenFromCode(code2);
  }
  reScan_lt_gt() {
    const {
      type
    } = this.state;
    if (type === 43) {
      this.state.pos -= 1;
      this.readToken_lt();
    } else if (type === 44) {
      this.state.pos -= 1;
      this.readToken_gt();
    }
  }
  reScan_lt() {
    const {
      type
    } = this.state;
    if (type === 47) {
      this.state.pos -= 2;
      this.finishOp(43, 1);
      return 43;
    }
    return type;
  }
  toAssignableListItem(exprList, index, isLHS) {
    const node = exprList[index];
    if (node.type === "TSTypeCastExpression") {
      exprList[index] = this.typeCastToParameter(node);
    }
    super.toAssignableListItem(exprList, index, isLHS);
  }
  typeCastToParameter(node) {
    node.expression.typeAnnotation = node.typeAnnotation;
    this.resetEndLocationFromNode(node.expression, node.typeAnnotation);
    return node.expression;
  }
  shouldParseArrow(params) {
    if (this.match(10)) {
      return params.every((expr) => this.isAssignable(expr, true));
    }
    return super.shouldParseArrow(params);
  }
  shouldParseAsyncArrow() {
    if (this.match(10)) {
      if (this.state.inConditionalConsequent) return false;
      return true;
    }
    return super.shouldParseAsyncArrow();
  }
  parseParenAndDistinguishExpression(canStartArrow) {
    const oldInConditionalConsequent = this.state.inConditionalConsequent;
    this.state.inConditionalConsequent = false;
    const result = super.parseParenAndDistinguishExpression(canStartArrow);
    this.state.inConditionalConsequent = oldInConditionalConsequent;
    return result;
  }
  canHaveLeadingDecorator() {
    return super.canHaveLeadingDecorator() || this.isAbstractClass();
  }
  jsxParseOpeningElementAfterName(node) {
    if (this.match(43) || this.match(47)) {
      const typeArguments = this.tsTryParseAndCatch(() => this.tsParseTypeArgumentsInExpression());
      if (typeArguments) {
        node.typeArguments = typeArguments;
      }
    }
    return super.jsxParseOpeningElementAfterName(node);
  }
  getGetterSetterExpectedParamCount(method) {
    const baseCount = super.getGetterSetterExpectedParamCount(method);
    const params = this.getObjectOrClassMethodParams(method);
    const firstParam = params[0];
    const hasContextParam = firstParam && this.isThisParam(firstParam);
    return hasContextParam ? baseCount + 1 : baseCount;
  }
  parseCatchClauseParam() {
    const param = super.parseCatchClauseParam();
    const type = this.tsTryParseTypeAnnotation();
    if (type) {
      param.typeAnnotation = type;
      this.resetEndLocation(param);
    }
    return param;
  }
  tsInAmbientContext(cb) {
    const {
      isAmbientContext: oldIsAmbientContext,
      strict: oldStrict
    } = this.state;
    this.state.isAmbientContext = true;
    this.state.strict = false;
    try {
      return cb();
    } finally {
      this.state.isAmbientContext = oldIsAmbientContext;
      this.state.strict = oldStrict;
    }
  }
  parseClass(node, isStatement, optionalId) {
    const oldInAbstractClass = this.state.inAbstractClass;
    this.state.inAbstractClass = !!node.abstract;
    try {
      return super.parseClass(node, isStatement, optionalId);
    } finally {
      this.state.inAbstractClass = oldInAbstractClass;
    }
  }
  tsParseAbstractDeclaration(node, decorators) {
    if (this.match(76)) {
      node.abstract = true;
      return this.maybeTakeDecorators(decorators, this.parseClass(node, true, false));
    } else if (this.isContextual(125)) {
      if (!this.hasFollowingLineBreak()) {
        node.abstract = true;
        this.raise(TSErrors.NonClassMethodPropertyHasAbstractModifier, node);
        return this.tsParseInterfaceDeclaration(node);
      } else {
        return null;
      }
    }
    throw this.unexpected(null, 76);
  }
  parseMethod(node, isGenerator, isAsync, isConstructor, allowDirectSuper, type, inClassScope) {
    const method = super.parseMethod(node, isGenerator, isAsync, isConstructor, allowDirectSuper, type, inClassScope);
    if (method.abstract || method.type === "TSAbstractMethodDefinition") {
      const hasEstreePlugin = this.hasPlugin("estree");
      const methodFn = hasEstreePlugin ? method.value : method;
      if (methodFn.body) {
        const {
          key
        } = method;
        this.raise(TSErrors.AbstractMethodHasImplementation, method, {
          methodName: key.type === "Identifier" && !method.computed ? key.name : `[${this.input.slice(this.offsetToSourcePos(key.start), this.offsetToSourcePos(key.end))}]`
        });
      }
    }
    return method;
  }
  tsParseTypeParameterName() {
    return this.parseIdentifier();
  }
  shouldParseAsAmbientContext() {
    return !!this.getPluginOption("typescript", "dts");
  }
  parse() {
    if (this.shouldParseAsAmbientContext()) {
      this.state.isAmbientContext = true;
    }
    return super.parse();
  }
  getExpression() {
    if (this.shouldParseAsAmbientContext()) {
      this.state.isAmbientContext = true;
    }
    return super.getExpression();
  }
  parseExportSpecifier(node, isString, isInTypeExport, isMaybeTypeOnly) {
    if (!isString && isMaybeTypeOnly) {
      this.parseTypeOnlyImportExportSpecifier(node, false, isInTypeExport);
      return this.finishNode(node, "ExportSpecifier");
    }
    node.exportKind = "value";
    return super.parseExportSpecifier(node, isString, isInTypeExport, isMaybeTypeOnly);
  }
  parseImportSpecifier(specifier, importedIsString, isInTypeOnlyImport, isMaybeTypeOnly, bindingType) {
    if (!importedIsString && isMaybeTypeOnly) {
      this.parseTypeOnlyImportExportSpecifier(specifier, true, isInTypeOnlyImport);
      return this.finishNode(specifier, "ImportSpecifier");
    }
    specifier.importKind = "value";
    return super.parseImportSpecifier(specifier, importedIsString, isInTypeOnlyImport, isMaybeTypeOnly, isInTypeOnlyImport ? 4098 : 4096);
  }
  parseTypeOnlyImportExportSpecifier(node, isImport, isInTypeOnlyImportExport) {
    const leftOfAsKey = isImport ? "imported" : "local";
    const rightOfAsKey = isImport ? "local" : "exported";
    let leftOfAs = node[leftOfAsKey];
    let rightOfAs;
    let hasTypeSpecifier = false;
    let canParseAsKeyword = true;
    const loc = leftOfAs.start;
    if (this.isContextual(89)) {
      const firstAs = this.parseIdentifier();
      if (this.isContextual(89)) {
        const secondAs = this.parseIdentifier();
        if (tokenIsKeywordOrIdentifier(this.state.type)) {
          hasTypeSpecifier = true;
          leftOfAs = firstAs;
          rightOfAs = isImport ? this.parseIdentifier() : this.parseModuleExportName();
          canParseAsKeyword = false;
        } else {
          rightOfAs = secondAs;
          canParseAsKeyword = false;
        }
      } else if (tokenIsKeywordOrIdentifier(this.state.type)) {
        canParseAsKeyword = false;
        rightOfAs = isImport ? this.parseIdentifier() : this.parseModuleExportName();
      } else {
        hasTypeSpecifier = true;
        leftOfAs = firstAs;
      }
    } else if (tokenIsKeywordOrIdentifier(this.state.type)) {
      hasTypeSpecifier = true;
      if (isImport) {
        leftOfAs = this.parseIdentifier(true);
        if (!this.isContextual(89)) {
          this.checkReservedWord(leftOfAs.name, leftOfAs.start, true, true);
        }
      } else {
        leftOfAs = this.parseModuleExportName();
      }
    }
    if (hasTypeSpecifier && isInTypeOnlyImportExport) {
      this.raise(isImport ? TSErrors.TypeModifierIsUsedInTypeImports : TSErrors.TypeModifierIsUsedInTypeExports, loc);
    }
    node[leftOfAsKey] = leftOfAs;
    node[rightOfAsKey] = rightOfAs;
    const kindKey = isImport ? "importKind" : "exportKind";
    node[kindKey] = hasTypeSpecifier ? "type" : "value";
    if (canParseAsKeyword && this.eatContextual(89)) {
      node[rightOfAsKey] = isImport ? this.parseIdentifier() : this.parseModuleExportName();
    }
    if (!node[rightOfAsKey]) {
      node[rightOfAsKey] = this.cloneIdentifier(node[leftOfAsKey]);
    }
    if (isImport) {
      this.checkIdentifier(node[rightOfAsKey], hasTypeSpecifier ? 4098 : 4096);
    }
  }
  fillOptionalPropertiesForTSESLint(node) {
    switch (node.type) {
      case "ExpressionStatement":
        node.directive ??= void 0;
        return;
      case "RestElement":
        node.value = void 0;
      case "Identifier":
      case "ArrayPattern":
      case "AssignmentPattern":
      case "ObjectPattern":
        node.decorators ??= [];
        node.optional ??= false;
        node.typeAnnotation ??= void 0;
        return;
      case "TSParameterProperty":
        node.accessibility ??= void 0;
        node.decorators ??= [];
        node.override ??= false;
        node.readonly ??= false;
        node.static ??= false;
        return;
      case "TSEmptyBodyFunctionExpression":
        node.body = null;
      case "TSDeclareFunction":
      case "FunctionDeclaration":
      case "FunctionExpression":
      case "ClassMethod":
      case "ClassPrivateMethod":
        node.declare ??= false;
        node.returnType ??= void 0;
        node.typeParameters ??= void 0;
        return;
      case "Property":
        node.optional ??= false;
        return;
      case "TSMethodSignature":
      case "TSPropertySignature":
        node.optional ??= false;
      case "TSIndexSignature":
        node.accessibility ??= void 0;
        node.readonly ??= false;
        node.static ??= false;
        return;
      case "TSAbstractPropertyDefinition":
      case "PropertyDefinition":
      case "TSAbstractAccessorProperty":
      case "AccessorProperty":
        node.declare ??= false;
        node.definite ??= false;
        node.readonly ??= false;
        node.typeAnnotation ??= void 0;
      case "TSAbstractMethodDefinition":
      case "MethodDefinition":
        node.accessibility ??= void 0;
        node.decorators ??= [];
        node.override ??= false;
        node.optional ??= false;
        return;
      case "ClassExpression":
        node.id ??= null;
      case "ClassDeclaration":
        node.abstract ??= false;
        node.declare ??= false;
        node.decorators ??= [];
        node.implements ??= [];
        node.superTypeArguments ??= void 0;
        node.typeParameters ??= void 0;
        return;
      case "TSTypeAliasDeclaration":
      case "VariableDeclaration":
        node.declare ??= false;
        return;
      case "VariableDeclarator":
        node.definite ??= false;
        return;
      case "TSEnumDeclaration":
        node.const ??= false;
        node.declare ??= false;
        return;
      case "TSEnumMember":
        node.computed ??= false;
        return;
      case "TSImportType":
        node.qualifier ??= null;
        node.options ??= null;
        node.typeArguments ??= null;
        return;
      case "TSInterfaceDeclaration":
        node.declare ??= false;
        node.extends ??= [];
        return;
      case "TSMappedType":
        node.optional ??= false;
        node.readonly ??= void 0;
        return;
      case "TSModuleDeclaration":
        node.declare ??= false;
        node.global ??= node.kind === "global";
        return;
      case "TSTypeParameter":
        node.const ??= false;
        node.in ??= false;
        node.out ??= false;
        return;
    }
  }
  chStartsBindingIdentifierAndNotRelationalOperator(ch, pos) {
    if (isIdentifierStart(ch)) {
      keywordAndTSRelationalOperator.lastIndex = pos;
      if (keywordAndTSRelationalOperator.test(this.input)) {
        const endCh = this.codePointAtPos(keywordAndTSRelationalOperator.lastIndex);
        if (!isIdentifierChar(endCh) && endCh !== 92) {
          return false;
        }
      }
      return true;
    } else if (ch === 92) {
      return true;
    } else {
      return false;
    }
  }
  nextTokenIsIdentifierAndNotTSRelationalOperatorOnSameLine() {
    const next = this.nextTokenInLineStart();
    const nextCh = this.codePointAtPos(next);
    return this.chStartsBindingIdentifierAndNotRelationalOperator(nextCh, next);
  }
  nextTokenIsStringLiteralOnSameLine() {
    const next = this.nextTokenInLineStart();
    const nextCh = this.codePointAtPos(next);
    return nextCh === 34 || nextCh === 39;
  }
};
function isPossiblyLiteralEnum(expression) {
  if (expression.type !== "MemberExpression") return false;
  const {
    computed,
    property
  } = expression;
  if (computed && property.type !== "StringLiteral" && (property.type !== "TemplateLiteral" || property.expressions.length > 0)) {
    return false;
  }
  return isUncomputedMemberExpressionChain(expression.object);
}
function isValidAmbientConstInitializer(expression, estree2) {
  const {
    type
  } = expression;
  if (expression.extra?.parenthesized) {
    return false;
  }
  if (estree2) {
    if (type === "Literal") {
      const {
        value
      } = expression;
      if (typeof value === "string" || typeof value === "boolean") {
        return true;
      }
    }
  } else {
    if (type === "StringLiteral" || type === "BooleanLiteral") {
      return true;
    }
  }
  if (isNumber(expression, estree2) || isNegativeNumber(expression, estree2)) {
    return true;
  }
  if (type === "TemplateLiteral" && expression.expressions.length === 0) {
    return true;
  }
  if (isPossiblyLiteralEnum(expression)) {
    return true;
  }
  return false;
}
function isNumber(expression, estree2) {
  if (estree2) {
    return expression.type === "Literal" && (typeof expression.value === "number" || "bigint" in expression);
  }
  return expression.type === "NumericLiteral" || expression.type === "BigIntLiteral";
}
function isNegativeNumber(expression, estree2) {
  if (expression.type === "UnaryExpression") {
    const {
      operator,
      argument
    } = expression;
    if (operator === "-" && isNumber(argument, estree2)) {
      return true;
    }
  }
  return false;
}
function isUncomputedMemberExpressionChain(expression) {
  if (expression.type === "Identifier") return true;
  if (expression.type !== "MemberExpression" || expression.computed) {
    return false;
  }
  return isUncomputedMemberExpressionChain(expression.object);
}
var PlaceholderErrorTemplates = {
  ClassNameIsRequired: "A class name is required.",
  UnexpectedSpace: "Unexpected space in placeholder."
};
var PlaceholderErrors = ParseErrorEnum`placeholders`(PlaceholderErrorTemplates);
var placeholders = (superClass) => class PlaceholdersParserMixin extends superClass {
  parsePlaceholder(expectedNode) {
    if (this.match(129)) {
      const node = this.startNode();
      this.next();
      this.assertNoSpace();
      node.name = super.parseIdentifier(true);
      this.assertNoSpace();
      this.expect(129);
      return this.finishPlaceholder(node, expectedNode);
    }
  }
  finishPlaceholder(node, expectedNode) {
    let placeholder = node;
    if (!placeholder.expectedNode || !placeholder.type) {
      placeholder = this.finishNode(placeholder, "Placeholder");
    }
    placeholder.expectedNode = expectedNode;
    return placeholder;
  }
  getTokenFromCode(code2) {
    if (code2 === 37 && this.input.charCodeAt(this.state.pos + 1) === 37) {
      this.finishOp(129, 2);
    } else {
      super.getTokenFromCode(code2);
    }
  }
  parseExprAtom(refExpressionErrors) {
    return this.parsePlaceholder("Expression") || super.parseExprAtom(refExpressionErrors);
  }
  parseIdentifier(liberal) {
    return this.parsePlaceholder("Identifier") || super.parseIdentifier(liberal);
  }
  checkReservedWord(word, startLoc, checkKeywords, isBinding) {
    if (word !== void 0) {
      super.checkReservedWord(word, startLoc, checkKeywords, isBinding);
    }
  }
  cloneIdentifier(node) {
    const cloned = super.cloneIdentifier(node);
    if (cloned.type === "Placeholder") {
      cloned.expectedNode = node.expectedNode;
    }
    return cloned;
  }
  cloneStringLiteral(node) {
    if (node.type === "Placeholder") {
      return this.cloneIdentifier(node);
    }
    return super.cloneStringLiteral(node);
  }
  parseBindingAtom() {
    return this.parsePlaceholder("Pattern") || super.parseBindingAtom();
  }
  isValidLVal(type, disallowCallExpression, isParenthesized, binding) {
    return type === "Placeholder" || super.isValidLVal(type, disallowCallExpression, isParenthesized, binding);
  }
  toAssignable(node, isLHS) {
    if (node && node.type === "Placeholder" && node.expectedNode === "Expression") {
      node.expectedNode = "Pattern";
    } else {
      super.toAssignable(node, isLHS);
    }
  }
  chStartsBindingIdentifier(ch, pos) {
    if (super.chStartsBindingIdentifier(ch, pos)) {
      return true;
    }
    const next = this.nextTokenStart();
    if (this.input.charCodeAt(next) === 37 && this.input.charCodeAt(next + 1) === 37) {
      return true;
    }
    return false;
  }
  verifyBreakContinue(node, isBreak) {
    if (node.label?.type === "Placeholder") return;
    super.verifyBreakContinue(node, isBreak);
  }
  parseExpressionStatement(node, expr) {
    if (expr.type !== "Placeholder" || expr.extra?.parenthesized) {
      return super.parseExpressionStatement(node, expr);
    }
    if (this.match(10)) {
      const stmt = node;
      stmt.label = this.finishPlaceholder(expr, "Identifier");
      this.next();
      stmt.body = super.parseStatementOrSloppyAnnexBFunctionDeclaration();
      return this.finishNode(stmt, "LabeledStatement");
    }
    this.semicolon();
    const stmtPlaceholder = node;
    stmtPlaceholder.name = expr.name;
    return this.finishPlaceholder(stmtPlaceholder, "Statement");
  }
  parseBlock(allowDirectives, createNewLexicalScope, afterBlockParse) {
    return this.parsePlaceholder("BlockStatement") || super.parseBlock(allowDirectives, createNewLexicalScope, afterBlockParse);
  }
  parseFunctionId(requireId) {
    return this.parsePlaceholder("Identifier") || super.parseFunctionId(requireId);
  }
  parseClass(node, isStatement, optionalId) {
    const type = isStatement ? "ClassDeclaration" : "ClassExpression";
    this.next();
    const oldStrict = this.state.strict;
    const placeholder = this.parsePlaceholder("Identifier");
    if (placeholder) {
      if (this.match(77) || this.match(129) || this.match(2)) {
        node.id = placeholder;
      } else if (optionalId || !isStatement) {
        node.id = null;
        node.body = this.finishPlaceholder(placeholder, "ClassBody");
        return this.finishNode(node, type);
      } else {
        throw this.raise(PlaceholderErrors.ClassNameIsRequired, this.state.startLoc);
      }
    } else {
      this.parseClassId(node, isStatement, optionalId);
    }
    super.parseClassSuper(node);
    node.body = this.parsePlaceholder("ClassBody") || super.parseClassBody(!!node.superClass, oldStrict);
    return this.finishNode(node, type);
  }
  parseExport(node, decorators) {
    const placeholder = this.parsePlaceholder("Identifier");
    if (!placeholder) return super.parseExport(node, decorators);
    const node2 = node;
    if (!this.isContextual(94) && !this.match(8)) {
      node2.specifiers = [];
      node2.source = null;
      node2.declaration = this.finishPlaceholder(placeholder, "Declaration");
      return this.finishNode(node2, "ExportNamedDeclaration");
    }
    this.expectPlugin("exportDefaultFrom");
    const specifier = this.startNode();
    specifier.exported = placeholder;
    node2.specifiers = [this.finishNode(specifier, "ExportDefaultSpecifier")];
    return super.parseExport(node2, decorators);
  }
  isExportDefaultSpecifier() {
    if (this.match(61)) {
      const next = this.nextTokenStart();
      if (this.isUnparsedContextual(next, "from")) {
        if (this.input.startsWith(tokenLabelName(129), this.nextTokenStartSince(next + 4))) {
          return true;
        }
      }
    }
    return super.isExportDefaultSpecifier();
  }
  maybeParseExportDefaultSpecifier(node, maybeDefaultIdentifier) {
    if (node.specifiers?.length) {
      return true;
    }
    return super.maybeParseExportDefaultSpecifier(node, maybeDefaultIdentifier);
  }
  checkExport(node) {
    const {
      specifiers
    } = node;
    if (specifiers?.length) {
      node.specifiers = specifiers.filter((node2) => node2.exported.type === "Placeholder");
    }
    super.checkExport(node);
    node.specifiers = specifiers;
  }
  parseImport(node) {
    const placeholder = this.parsePlaceholder("Identifier");
    if (!placeholder) return super.parseImport(node);
    node.specifiers = [];
    if (!this.isContextual(94) && !this.match(8)) {
      node.source = this.finishPlaceholder(placeholder, "StringLiteral");
      this.semicolon();
      return this.finishNode(node, "ImportDeclaration");
    }
    const specifier = this.startNodeAtNode(placeholder);
    specifier.local = placeholder;
    node.specifiers.push(this.finishNode(specifier, "ImportDefaultSpecifier"));
    if (this.eat(8)) {
      const hasStarImport = this.maybeParseStarImportSpecifier(node);
      if (!hasStarImport) this.parseNamedImportSpecifiers(node);
    }
    this.expectContextual(94);
    node.source = this.parseImportSource();
    this.semicolon();
    return this.finishNode(node, "ImportDeclaration");
  }
  parseImportSource() {
    return this.parsePlaceholder("StringLiteral") || super.parseImportSource();
  }
  assertNoSpace() {
    if (this.state.start > this.offsetToSourcePos(this.state.lastTokEndLoc.index)) {
      this.raise(PlaceholderErrors.UnexpectedSpace, this.state.lastTokEndLoc);
    }
  }
};
var v8intrinsic = (superClass) => class V8IntrinsicMixin extends superClass {
  parseV8Intrinsic() {
    if (this.match(50)) {
      const v8IntrinsicStartLoc = this.state.startLoc;
      const node = this.startNode();
      this.next();
      if (tokenIsIdentifier(this.state.type)) {
        const name = this.parseIdentifierName();
        const identifier = this.createIdentifier(node, name);
        this.castNodeTo(identifier, "V8IntrinsicIdentifier");
        if (this.match(6)) {
          return identifier;
        }
      }
      this.unexpected(v8IntrinsicStartLoc);
    }
  }
  parseExprAtom(refExpressionErrors) {
    return this.parseV8Intrinsic() || super.parseExprAtom(refExpressionErrors);
  }
};
var PIPELINE_PROPOSALS = ["fsharp", "hack"];
var TOPIC_TOKENS = ["^^", "@@", "^", "%", "#"];
function validatePlugins(pluginsMap) {
  if (pluginsMap.has("decorators")) {
    if (pluginsMap.has("decorators-legacy")) {
      throw new Error("Cannot use the decorators and decorators-legacy plugin together");
    }
  }
  if (pluginsMap.has("flow") && pluginsMap.has("typescript")) {
    throw new Error("Cannot combine flow and typescript plugins.");
  }
  if (pluginsMap.has("placeholders") && pluginsMap.has("v8intrinsic")) {
    throw new Error("Cannot combine placeholders and v8intrinsic plugins.");
  }
  if (pluginsMap.has("pipelineOperator")) {
    const proposal = pluginsMap.get("pipelineOperator").proposal;
    if (!PIPELINE_PROPOSALS.includes(proposal)) {
      const proposalList = PIPELINE_PROPOSALS.map((p) => `"${p}"`).join(", ");
      throw new Error(`"pipelineOperator" requires "proposal" option whose value must be one of: ${proposalList}.`);
    }
    if (proposal === "hack") {
      if (pluginsMap.has("placeholders")) {
        throw new Error("Cannot combine placeholders plugin and Hack-style pipes.");
      }
      if (pluginsMap.has("v8intrinsic")) {
        throw new Error("Cannot combine v8intrinsic plugin and Hack-style pipes.");
      }
      const topicToken = pluginsMap.get("pipelineOperator").topicToken;
      if (!TOPIC_TOKENS.includes(topicToken)) {
        const tokenList = TOPIC_TOKENS.map((t) => `"${t}"`).join(", ");
        throw new Error(`"pipelineOperator" in "proposal": "hack" mode also requires a "topicToken" option whose value must be one of: ${tokenList}.`);
      }
    }
  }
  if (pluginsMap.has("moduleAttributes")) {
    throw new Error("`moduleAttributes` has been removed in Babel 8, please migrate to import attributes instead.");
  }
  if (pluginsMap.has("importAssertions")) {
    throw new Error("`importAssertions` has been removed in Babel 8, please use import attributes instead.");
  }
  if (pluginsMap.has("deprecatedImportAssert")) {
    console.warn("`deprecatedImportAssert` has been removed in Babel 8, please use import attributes instead.");
  } else if (pluginsMap.has("importAttributes") && pluginsMap.get("importAttributes").deprecatedAssertSyntax) {
    console.warn("The 'importAttributes' plugin has been removed in Babel 8. Please migrate any usage of `assert`-style attributes to `with`.");
  }
  if (pluginsMap.has("recordAndTuple")) {
    throw new Error("The 'recordAndTuple' plugin has been removed in Babel 8. Please remove it from your configuration.");
  }
  if (pluginsMap.has("asyncDoExpressions") && !pluginsMap.has("doExpressions")) {
    const error = new Error("'asyncDoExpressions' requires 'doExpressions', please add 'doExpressions' to parser plugins.");
    error.missingPlugins = "doExpressions";
    throw error;
  }
  if (pluginsMap.has("optionalChainingAssign") && pluginsMap.get("optionalChainingAssign").version !== "2023-07") {
    throw new Error("The 'optionalChainingAssign' plugin requires a 'version' option, representing the last proposal update. Currently, the only supported value is '2023-07'.");
  }
  if (pluginsMap.has("discardBinding") && pluginsMap.get("discardBinding").syntaxType !== "void") {
    throw new Error("The 'discardBinding' plugin requires a 'syntaxType' option. Currently the only supported value is 'void'.");
  }
  if (pluginsMap.has("decimal")) {
    throw new Error("The 'decimal' plugin has been removed in Babel 8. Please remove it from your configuration.");
  }
  if (pluginsMap.has("importReflection")) {
    throw new Error("The 'importReflection' plugin has been removed in Babel 8. Use 'sourcePhaseImports' instead, and replace 'import module' with 'import source' in your code.");
  }
}
var mixinPlugins = {
  estree,
  jsx,
  flow,
  typescript,
  v8intrinsic,
  placeholders
};
var mixinPluginNames = Object.keys(mixinPlugins);
var Parser = class extends StatementParser {
  constructor(options, input, pluginsMap) {
    const normalizedOptions = getOptions(options);
    super(normalizedOptions, input);
    this.options = normalizedOptions;
    this.initializeScopes();
    this.plugins = pluginsMap;
    this.filename = normalizedOptions.sourceFilename;
    this.startIndex = normalizedOptions.startIndex;
    let optionFlags = 0;
    if (normalizedOptions.allowAwaitOutsideFunction) {
      optionFlags |= 1;
    }
    if (normalizedOptions.allowReturnOutsideFunction) {
      optionFlags |= 2;
    }
    if (normalizedOptions.allowImportExportEverywhere) {
      optionFlags |= 8;
    }
    if (normalizedOptions.allowSuperOutsideMethod) {
      optionFlags |= 16;
    }
    if (normalizedOptions.allowUndeclaredExports) {
      optionFlags |= 64;
    }
    if (normalizedOptions.allowNewTargetOutsideFunction) {
      optionFlags |= 4;
    }
    if (normalizedOptions.allowYieldOutsideFunction) {
      optionFlags |= 32;
    }
    if (normalizedOptions.ranges) {
      optionFlags |= 128;
    }
    if (normalizedOptions.locations === true) {
      optionFlags |= 256;
    }
    if (normalizedOptions.tokens) {
      optionFlags |= 512;
    }
    if (normalizedOptions.createImportExpressions) {
      optionFlags |= 1024;
    }
    if (normalizedOptions.createParenthesizedExpressions) {
      optionFlags |= 2048;
    }
    if (normalizedOptions.errorRecovery) {
      optionFlags |= 4096;
    }
    if (normalizedOptions.attachComment) {
      optionFlags |= 8192;
    }
    if (normalizedOptions.annexB) {
      optionFlags |= 16384;
    }
    this.optionFlags = optionFlags;
  }
  getScopeHandler() {
    return ScopeHandler;
  }
  parse() {
    this.enterInitialScopes();
    const file = this.startNode();
    const program = this.startNode();
    this.nextToken();
    file.errors = [];
    const result = this.parseTopLevel(file, program);
    result.errors = this.state.errors;
    result.comments.length = this.state.commentsLen;
    return result;
  }
};
function parse(input, options) {
  if (options?.sourceType === "unambiguous") {
    options = {
      ...options
    };
    try {
      options.sourceType = "module";
      const parser = getParser(options, input);
      const ast = parser.parse();
      if (parser.sawUnambiguousESM) {
        return ast;
      }
      if (parser.ambiguousScriptDifferentAst) {
        try {
          options.sourceType = "script";
          return getParser(options, input).parse();
        } catch {
        }
      } else {
        ast.program.sourceType = "script";
      }
      return ast;
    } catch (moduleError) {
      try {
        options.sourceType = "script";
        return getParser(options, input).parse();
      } catch {
      }
      throw moduleError;
    }
  } else {
    return getParser(options, input).parse();
  }
}
function generateExportedTokenTypes(internalTokenTypes) {
  const tokenTypes2 = {};
  for (const typeName of Object.keys(internalTokenTypes)) {
    tokenTypes2[typeName] = getExportedToken(internalTokenTypes[typeName]);
  }
  return tokenTypes2;
}
var tokTypes = generateExportedTokenTypes(tt);
function getParser(options, input) {
  let cls = Parser;
  const pluginsMap = /* @__PURE__ */ new Map();
  if (options?.plugins) {
    for (const plugin of options.plugins) {
      let name, opts;
      if (typeof plugin === "string") {
        name = plugin;
      } else {
        [name, opts] = plugin;
      }
      if (!pluginsMap.has(name)) {
        pluginsMap.set(name, opts || {});
      }
    }
    validatePlugins(pluginsMap);
    cls = getParserClass(pluginsMap);
  }
  return new cls(options, input, pluginsMap);
}
var parserClassCache = /* @__PURE__ */ new Map();
function getParserClass(pluginsMap) {
  const pluginList = [];
  for (const name of mixinPluginNames) {
    if (pluginsMap.has(name)) {
      pluginList.push(name);
    }
  }
  const key = pluginList.join("|");
  let cls = parserClassCache.get(key);
  if (!cls) {
    cls = Parser;
    for (const plugin of pluginList) {
      cls = mixinPlugins[plugin](cls);
    }
    parserClassCache.set(key, cls);
  }
  return cls;
}

// src/parse/parse.ts
var LEGACY = ["typescript", "jsx", "decorators-legacy"];
var PROPOSAL = [
  "typescript",
  "jsx",
  "decorators",
  "decoratorAutoAccessors"
];
function parseModule(source, fileName = "input.tsx") {
  for (const plugins of [LEGACY, PROPOSAL]) {
    try {
      return parse(source, { sourceType: "module", sourceFilename: fileName, plugins });
    } catch {
    }
  }
  return null;
}
function walk(root, visit) {
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    visit(current);
    stack.push(...childNodes(current));
  }
}
function childNodes(node) {
  const out = [];
  for (const key of Object.keys(node)) {
    const child = node[key];
    if (Array.isArray(child)) {
      for (const item of child) {
        if (item !== null && typeof item === "object" && "type" in item) out.push(item);
      }
    } else if (child !== null && typeof child === "object" && "type" in child) {
      out.push(child);
    }
  }
  return out;
}

// src/layers/chain.ts
import { relative, isAbsolute } from "node:path";
function contains(root, filePath) {
  const rel = relative(root, filePath);
  return rel !== "" && !rel.startsWith("..") && !isAbsolute(rel);
}
function owningPackage(filePath, packages) {
  let best = null;
  for (const pkg of packages) {
    if (!contains(pkg.root, filePath)) continue;
    if (best === null || pkg.root.length > best.root.length) best = pkg;
  }
  return best;
}
function resolveChain(filePath, packages, prefer = []) {
  const owner = owningPackage(filePath, packages);
  if (owner === null) return [];
  const byName = new Map(packages.map((p) => [p.name, p]));
  const ordered = [];
  const done = /* @__PURE__ */ new Set();
  const onStack = /* @__PURE__ */ new Set();
  const visit = (name) => {
    if (done.has(name) || onStack.has(name)) return;
    onStack.add(name);
    const pkg = byName.get(name);
    for (const dep of pkg?.dependencies ?? []) visit(dep);
    onStack.delete(name);
    done.add(name);
    ordered.push({ name, root: pkg?.root ?? null, dependencies: pkg?.dependencies ?? [] });
  };
  visit(owner.name);
  ordered.reverse();
  if (prefer.length === 0) return ordered;
  const rank = (layer) => {
    if (layer.name === owner.name) return -1;
    const index = prefer.indexOf(layer.name);
    return index === -1 ? prefer.length : index;
  };
  return ordered.map((layer, index) => ({ layer, index })).sort((a, b) => rank(a.layer) - rank(b.layer) || a.index - b.index).map(({ layer }) => layer);
}
function layerFor(specifier, chain) {
  if (specifier.startsWith(".")) return null;
  let best = null;
  for (const layer of chain) {
    if (specifier !== layer.name && !specifier.startsWith(`${layer.name}/`)) continue;
    if (best === null || layer.name.length > best.name.length) best = layer;
  }
  return best;
}

// src/layers/tsconfig.ts
import { realpath } from "node:fs/promises";
var TSCONFIG_CANDIDATES = ["tsconfig.base.json", "tsconfig.json"];
function parseTsconfig(raw) {
  const withoutComments2 = raw.replace(
    /"(?:[^"\\]|\\.)*"|\/\*[\s\S]*?\*\/|\/\/[^\n]*/g,
    (match) => match.startsWith('"') ? match : ""
  ).replace(/,(\s*[}\]])/g, "$1");
  try {
    return JSON.parse(withoutComments2);
  } catch {
    return null;
  }
}
async function tsconfigPaths(rootDir) {
  for (const candidate of TSCONFIG_CANDIDATES) {
    const found = await pathsIn(join(rootDir, candidate), 0);
    if (found !== null) return found;
  }
  return null;
}
var MAX_EXTENDS_DEPTH = 8;
async function pathsIn(file, depth) {
  const raw = await readFile(file, "utf8").catch(() => null);
  if (raw === null) return null;
  const config = parseTsconfig(raw);
  if (config === null) return null;
  const options = config["compilerOptions"];
  const paths = options !== null && typeof options === "object" ? options.paths : null;
  if (paths !== null && paths !== void 0 && typeof paths === "object") {
    const entries = Object.entries(paths).flatMap(
      ([key, value]) => Array.isArray(value) && value.every((v) => typeof v === "string") ? [[key, value]] : []
    );
    if (entries.length > 0) {
      const declaredBase = options.baseUrl;
      const baseUrl = resolve(dirname(file), typeof declaredBase === "string" ? declaredBase : ".");
      return { paths: Object.fromEntries(entries), baseUrl, file };
    }
  }
  if (depth >= MAX_EXTENDS_DEPTH) return null;
  const extended = config["extends"];
  if (typeof extended !== "string" || !extended.startsWith(".")) return null;
  const target = resolve(dirname(file), extended);
  for (const suffix of ["", ".json"]) {
    const found = await pathsIn(`${target}${suffix}`, depth + 1);
    if (found !== null) return found;
  }
  return null;
}
async function packageRootFor(target) {
  const isDirectory = await stat(target).then(
    (s) => s.isDirectory(),
    () => false
  );
  const dir = isDirectory ? target : dirname(target);
  return basename(dir) === "src" ? dirname(dir) : dir;
}
var GENERATED_DIRECTORY = /* @__PURE__ */ new Set(["dist", "build", "out", "coverage", "generated"]);
function isGenerated(base, resolved) {
  const inside = relative2(base, resolved);
  if (inside.startsWith("..")) return false;
  return inside.split(sep).some((segment) => GENERATED_DIRECTORY.has(segment) || /^\.[^.]/.test(segment));
}
async function insideProject(rootDir, target) {
  const real = await realpath(target).catch(() => null);
  if (real === null) return contains(rootDir, target);
  const root = await realpath(rootDir).catch(() => rootDir);
  return contains(root, real);
}
async function packagesFromTsconfigPaths(rootDir) {
  const declared = await tsconfigPaths(rootDir);
  if (declared === null) return [];
  const base = declared.baseUrl;
  const found = /* @__PURE__ */ new Map();
  for (const [alias, targets] of Object.entries(declared.paths)) {
    if (alias.includes("*")) continue;
    const target = targets[0];
    if (target === void 0 || target.includes("*")) continue;
    if (found.has(alias)) continue;
    const resolved = resolve(base, target);
    if (resolved.split(sep).includes("node_modules")) continue;
    if (isGenerated(base, resolved)) continue;
    if (!await insideProject(rootDir, resolved)) continue;
    found.set(alias, await packageRootFor(resolved));
  }
  return [...found].map(([name, root]) => ({ name, root }));
}
var SOURCE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mts", ".cts"];
var SKIPPED_DIRECTORIES = /* @__PURE__ */ new Set([
  "node_modules",
  "dist",
  "build",
  "out",
  "coverage",
  ".git",
  ".next",
  ".nx",
  ".cache"
]);
function packageNameOf(specifier) {
  const segments = specifier.split("/");
  return specifier.startsWith("@") ? segments.slice(0, 2).join("/") : segments[0];
}
function edgeFor(specifier, layers) {
  let best = null;
  for (const name of layers) {
    if (specifier !== name && !specifier.startsWith(`${name}/`)) continue;
    if (best === null || name.length > best.length) best = name;
  }
  return best ?? packageNameOf(specifier);
}
async function collectSourceFiles(dir, stopAt, into) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => null);
  if (entries === null) return;
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIPPED_DIRECTORIES.has(entry.name) || stopAt.has(path)) continue;
      await collectSourceFiles(path, stopAt, into);
      continue;
    }
    if (SOURCE_EXTENSIONS.some((ext) => entry.name.endsWith(ext))) into.push(path);
  }
}
async function derivedDependencies(root, stopAt, layers = []) {
  const files = [];
  await collectSourceFiles(root, stopAt, files);
  const dependencies = /* @__PURE__ */ new Set();
  for (const file of files) {
    const source = await readFile(file, "utf8").catch(() => null);
    if (source === null) continue;
    const ast = parseModule(source, file);
    if (ast === null) continue;
    for (const statement of ast.program.body) {
      const specifier = statement.type === "ImportDeclaration" || statement.type === "ExportAllDeclaration" || statement.type === "ExportNamedDeclaration" && statement.source !== null ? statement.source?.value : void 0;
      if (specifier === void 0 || specifier === null) continue;
      if (specifier.startsWith(".") || specifier.startsWith("/")) continue;
      dependencies.add(edgeFor(specifier, layers));
    }
  }
  return [...dependencies].sort();
}

// src/layers/detect.ts
async function readJson(path) {
  try {
    return JSON.parse(await readFile2(path, "utf8"));
  } catch {
    return null;
  }
}
async function childDirectories(dir) {
  const entries = await readdir2(dir, { withFileTypes: true }).catch(() => []);
  return entries.filter((e) => e.isDirectory() && !e.name.startsWith(".") && e.name !== "node_modules").map((e) => join2(dir, e.name));
}
var MAX_GLOBSTAR_DEPTH = 6;
async function descendantDirectories(dir, depth = 0) {
  if (depth >= MAX_GLOBSTAR_DEPTH) return [dir];
  const children = await childDirectories(dir);
  const below = await Promise.all(children.map((child) => descendantDirectories(child, depth + 1)));
  return [dir, ...below.flat()];
}
async function expandPattern(rootDir, pattern2) {
  const segments = pattern2.split("/").filter((s) => s !== "" && s !== ".");
  let current = [resolve2(rootDir)];
  for (const segment of segments) {
    if (segment !== "*" && segment !== "**") {
      current = current.map((dir) => join2(dir, segment));
      continue;
    }
    const expanded = await Promise.all(
      current.map((dir) => segment === "*" ? childDirectories(dir) : descendantDirectories(dir))
    );
    current = expanded.flat();
  }
  return current;
}
async function workspacePatterns(rootDir) {
  const yaml = await readFile2(join2(rootDir, "pnpm-workspace.yaml"), "utf8").catch(() => null);
  if (yaml !== null) {
    return [...yaml.matchAll(/^\s*-\s*['"]?([^'"\n]+)['"]?\s*$/gm)].map((m) => m[1].trim());
  }
  const pkg = await readJson(join2(rootDir, "package.json"));
  const workspaces = pkg?.["workspaces"];
  if (Array.isArray(workspaces)) {
    return workspaces.filter((w) => typeof w === "string");
  }
  if (workspaces !== null && typeof workspaces === "object") {
    const nested = workspaces.packages;
    if (Array.isArray(nested)) return nested.filter((w) => typeof w === "string");
  }
  return [];
}
async function toPackageInfo(dir) {
  const pkg = await readJson(join2(dir, "package.json"));
  if (pkg === null) return null;
  const name = pkg["name"];
  if (typeof name !== "string") return null;
  const dependencies = ["dependencies", "devDependencies", "peerDependencies"].flatMap((field) => {
    const value = pkg[field];
    return value !== null && typeof value === "object" ? Object.keys(value) : [];
  });
  return { name, root: dir, dependencies: [...new Set(dependencies)] };
}
async function declaresWorkspaceAliases(dir) {
  const aliases = await tsconfigPaths(dir);
  if (aliases === null || dirname2(aliases.file) !== dir) return false;
  return (await packagesFromTsconfigPaths(dir)).length > 0;
}
async function findProjectRoot(startDir) {
  let current = resolve2(startDir);
  let nearestPackage = null;
  for (; ; ) {
    if ((await workspacePatterns(current)).length > 0) return current;
    if (await declaresWorkspaceAliases(current)) return current;
    if (nearestPackage === null && await readJson(join2(current, "package.json")) !== null) {
      nearestPackage = current;
    }
    const parent = dirname2(current);
    if (parent === current) return nearestPackage;
    current = parent;
  }
}
async function detectPackagesDetailed(rootDir) {
  const declared = await declaredPackages(rootDir);
  const aliased = await ownLayersAmong(rootDir, await packagesFromTsconfigPaths(rootDir));
  if (declared.length === 0 && aliased.length === 0) {
    const single = await toPackageInfo(rootDir);
    return { packages: single === null ? [] : [single], derived: false };
  }
  const byName = new Set(declared.map((p) => p.name));
  const byRoot = new Set(declared.map((p) => p.root));
  const missing = aliased.filter((p) => !byName.has(p.name) && !byRoot.has(p.root));
  const roots = [...declared, ...missing].map((p) => p.root);
  const names = [...declared.map((p) => p.name), ...missing.map((p) => p.name)];
  const withDerivedEdges = async (pkg) => {
    const nested = new Set(roots.filter((r) => r !== pkg.root && r.startsWith(`${pkg.root}${sep2}`)));
    const edges = await derivedDependencies(pkg.root, nested, names);
    return { ...pkg, dependencies: edges.filter((edge) => edge !== pkg.name) };
  };
  const undeclared = declared.filter((pkg) => pkg.dependencies.length === 0);
  const filled = await Promise.all(
    declared.map(async (pkg) => pkg.dependencies.length === 0 ? withDerivedEdges(pkg) : pkg)
  );
  const added = await Promise.all(missing.map(withDerivedEdges));
  return {
    packages: [...filled, ...added],
    derived: undeclared.length > 0 || missing.length > 0
  };
}
async function detectionSources(rootDir) {
  const sources2 = [];
  if ((await workspacePatterns(rootDir)).length > 0) {
    const yaml = await readFile2(join2(rootDir, "pnpm-workspace.yaml"), "utf8").catch(() => null);
    sources2.push(yaml === null ? "package.json workspaces" : "pnpm-workspace.yaml");
  }
  const aliases = await tsconfigPaths(rootDir);
  if (aliases !== null) sources2.push(`${basename2(aliases.file)} paths`);
  return sources2;
}
async function sourceDirOf(rootDir) {
  const pkg = await readJson(join2(rootDir, "package.json"));
  if (pkg === null) return null;
  for (const field of ["source", "module", "main"]) {
    const value = pkg[field];
    if (typeof value !== "string") continue;
    const dir = dirname2(resolve2(rootDir, value));
    if (dir !== resolve2(rootDir)) return dir;
  }
  const conventional = join2(rootDir, "src");
  const found = await stat2(conventional).catch(() => null);
  return found?.isDirectory() === true ? conventional : null;
}
async function ownLayersAmong(rootDir, aliased) {
  const sourceDir = await sourceDirOf(rootDir);
  if (sourceDir === null) return aliased;
  return aliased.filter((pkg) => pkg.root !== sourceDir && !pkg.root.startsWith(`${sourceDir}${sep2}`));
}
async function declaredPackages(rootDir) {
  const patterns2 = await workspacePatterns(rootDir);
  if (patterns2.length === 0) return [];
  const dirs = (await Promise.all(patterns2.map((p) => expandPattern(rootDir, p)))).flat();
  const found = await Promise.all(
    dirs.map(async (dir) => {
      const s = await stat2(dir).catch(() => null);
      return s?.isDirectory() === true ? toPackageInfo(dir) : null;
    })
  );
  return found.filter((p) => p !== null);
}

// src/layers/cache.ts
import { readFile as readFile6, rm as rm2, stat as stat4, writeFile as writeFile2 } from "node:fs/promises";
import { join as join7 } from "node:path";

// src/inventory/cache.ts
import { readFile as readFile5, writeFile, rm, stat as stat3 } from "node:fs/promises";
import { join as join6 } from "node:path";

// src/inventory/build.ts
import { readFile as readFile4 } from "node:fs/promises";
import { dirname as dirname3, join as join4 } from "node:path";

// src/inventory/exports.ts
import { readFile as readFile3 } from "node:fs/promises";
import { join as join3 } from "node:path";
function exportedNamesOf(statement) {
  if (statement.type !== "ExportNamedDeclaration") return [];
  if (statement.exportKind === "type") return [];
  const declaration = statement.declaration;
  if (declaration !== null && declaration !== void 0) {
    switch (declaration.type) {
      case "FunctionDeclaration":
      case "ClassDeclaration":
        return declaration.id === null || declaration.id === void 0 ? [] : [declaration.id.name];
      case "VariableDeclaration":
        return declaration.declarations.flatMap(
          (d) => d.id.type === "Identifier" ? [d.id.name] : []
        );
      case "TSEnumDeclaration":
        return [declaration.id.name];
      default:
        return [];
    }
  }
  return statement.specifiers.flatMap((specifier) => {
    if (specifier.type !== "ExportSpecifier") return [];
    if (specifier.exportKind === "type") return [];
    const exported = specifier.exported;
    return exported.type === "Identifier" && exported.name !== "default" ? [exported.name] : [];
  });
}
function exportedSymbolsOf(ast) {
  const names = /* @__PURE__ */ new Set();
  for (const statement of ast.program.body) {
    for (const name of exportedNamesOf(statement)) names.add(name);
  }
  return names;
}
function exportedSymbolsFromSource(source) {
  const ast = parseModule(source);
  return ast === null ? /* @__PURE__ */ new Set() : exportedSymbolsOf(ast);
}
function starReexportsFromSource(source) {
  const ast = parseModule(source);
  if (ast === null) return [];
  return ast.program.body.flatMap(
    (statement) => statement.type === "ExportAllDeclaration" && statement.exportKind !== "type" ? [statement.source.value] : []
  );
}
var ENTRY_CANDIDATES = [
  "src/index.ts",
  "src/index.tsx",
  "index.ts",
  "index.tsx",
  "src/index.js",
  "index.js"
];
async function entryFileFor(packageRoot) {
  const raw = await readFile3(join3(packageRoot, "package.json"), "utf8").catch(() => null);
  if (raw !== null) {
    try {
      const pkg = JSON.parse(raw);
      for (const field of [pkg.source, pkg.module, pkg.main]) {
        if (typeof field === "string") return join3(packageRoot, field);
      }
    } catch {
    }
  }
  for (const candidate of ENTRY_CANDIDATES) {
    const path = join3(packageRoot, candidate);
    if (await readFile3(path, "utf8").catch(() => null) !== null) return path;
  }
  return null;
}

// src/inventory/deprecated.ts
function linkTarget(text) {
  const match = /\{@link\s+([A-Za-z_$][\w$]*)/.exec(text);
  return match === null ? null : match[1];
}
function deprecationComment(comments) {
  for (const comment of comments ?? []) {
    if (comment.type !== "CommentBlock") continue;
    if (/@deprecated\b/.test(comment.value)) return comment;
  }
  return null;
}
function deprecationsFromSource(source) {
  const found = /* @__PURE__ */ new Map();
  const ast = parseModule(source);
  if (ast === null) return found;
  for (const statement of ast.program.body) {
    if (statement.type !== "ExportNamedDeclaration") continue;
    const comment = deprecationComment(statement.leadingComments);
    if (comment === null) continue;
    const replacement = linkTarget(comment.value);
    for (const name of exportedNamesOf(statement)) found.set(name, replacement);
  }
  return found;
}

// src/inventory/build.ts
var readFromDisk = (path) => readFile4(path, "utf8").catch(() => null);
var MODULE_SUFFIXES = ["", ".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.tsx", "/index.js"];
var MAX_STAR_DEPTH = 8;
async function readRelative(fromFile, specifier, readSource) {
  const base = join4(dirname3(fromFile), specifier);
  for (const suffix of MODULE_SUFFIXES) {
    const path = `${base}${suffix}`;
    const source = await readSource(path);
    if (source !== null) return { path, source };
  }
  return null;
}
async function buildInventory(layers, io = {}) {
  const readSource = io.readSource ?? readFromDisk;
  const resolveEntry = io.resolveEntry ?? entryFileFor;
  const inventory2 = { layers: {} };
  for (const layer of layers) {
    const symbols = {};
    inventory2.layers[layer.name] = symbols;
    if (layer.root === null) continue;
    const entry = await resolveEntry(layer.root);
    if (entry === null) continue;
    const source = await readSource(entry);
    if (source === null) continue;
    await collect(entry, source, symbols, readSource, /* @__PURE__ */ new Set([entry]), 0);
  }
  return inventory2;
}
async function collect(file, source, symbols, readSource, seen, depth) {
  const deprecations = deprecationsFromSource(source);
  for (const name of exportedSymbolsFromSource(source)) {
    if (symbols[name] !== void 0) continue;
    const deprecated = deprecations.has(name);
    symbols[name] = {
      deprecated,
      replacement: deprecated ? deprecations.get(name) ?? null : null
    };
  }
  if (depth >= MAX_STAR_DEPTH) return;
  for (const specifier of starReexportsFromSource(source)) {
    if (!specifier.startsWith(".")) continue;
    const target = await readRelative(file, specifier, readSource);
    if (target === null || seen.has(target.path)) continue;
    seen.add(target.path);
    await collect(target.path, target.source, symbols, readSource, seen, depth + 1);
  }
}

// src/core/cache-dir.ts
import { createHash } from "node:crypto";
import { lstat, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join as join5 } from "node:path";
var OWNER_ONLY = 448;
var cacheRoot = () => join5(tmpdir(), `uic-cache-${process.getuid?.() ?? "shared"}`);
async function ensureOwned(path) {
  await mkdir(path, { recursive: true, mode: OWNER_ONLY }).catch(() => null);
  const found = await lstat(path).catch(() => null);
  if (found === null || !found.isDirectory()) return false;
  if (process.getuid !== void 0 && found.uid !== process.getuid()) return false;
  return true;
}
async function ownedDir(...segments) {
  const root = cacheRoot();
  if (!await ensureOwned(root)) return null;
  const path = join5(root, ...segments);
  return await ensureOwned(path) ? path : null;
}
var projectKey = (rootDir) => createHash("sha256").update(rootDir).digest("hex").slice(0, 16);

// src/inventory/cache.ts
var CACHE_VERSION = 1;
async function cacheDirFor(rootDir) {
  return ownedDir(projectKey(rootDir));
}
var fileIn = (dir) => join6(dir, "inventory.json");
async function readCache(rootDir) {
  const empty = { version: CACHE_VERSION, chains: {} };
  const dir = await cacheDirFor(rootDir);
  const raw = dir === null ? null : await readFile5(fileIn(dir), "utf8").catch(() => null);
  if (raw === null) return empty;
  try {
    const parsed = JSON.parse(raw);
    return parsed.version === CACHE_VERSION && typeof parsed.chains === "object" ? parsed : empty;
  } catch {
    return empty;
  }
}
var mtimeOf = (path) => stat3(path).then(
  (s) => s.mtimeMs,
  () => null
);
async function stillValid(sources2) {
  const checks = Object.entries(sources2).map(async ([path, when]) => await mtimeOf(path) === when);
  return (await Promise.all(checks)).every(Boolean);
}
async function cachedInventory(rootDir, layers, io = {}) {
  const key = layers.map((layer) => `${layer.name}@${layer.root ?? ""}`).join(">");
  const cache = await readCache(rootDir);
  const hit = cache.chains[key];
  if (hit !== void 0 && await stillValid(hit.sources)) {
    return { layers: hit.layers };
  }
  const sources2 = {};
  const underlying = io.readSource ?? ((path) => readFile5(path, "utf8").catch(() => null));
  const inventory2 = await buildInventory(layers, {
    ...io,
    readSource: async (path) => {
      const source = await underlying(path);
      if (source !== null) {
        const when = await mtimeOf(path);
        if (when !== null) sources2[path] = when;
      }
      return source;
    }
  });
  cache.chains[key] = { sources: sources2, layers: inventory2.layers };
  const into = await cacheDirFor(rootDir);
  if (into !== null) {
    await writeFile(fileIn(into), JSON.stringify(cache), "utf8").catch(() => {
    });
  }
  return inventory2;
}

// src/layers/cache.ts
var CACHE_VERSION2 = 1;
var fileIn2 = (dir) => join7(dir, "packages.json");
async function clearPackageCache(rootDir) {
  const dir = await cacheDirFor(rootDir);
  if (dir !== null) await rm2(fileIn2(dir), { force: true });
}
var mtimeOf2 = (path) => stat4(path).then(
  (s) => s.mtimeMs,
  () => null
);
async function cachedPackages(rootDir) {
  const layout = await layoutSignature(rootDir);
  const dir = await cacheDirFor(rootDir);
  const path = dir === null ? null : fileIn2(dir);
  const raw = path === null ? null : await readFile6(path, "utf8").catch(() => null);
  if (raw !== null) {
    try {
      const cached2 = JSON.parse(raw);
      if (cached2.version === CACHE_VERSION2 && Array.isArray(cached2.packages) && sameSignature(cached2.layout, layout)) {
        return cached2.packages;
      }
    } catch {
    }
  }
  const { packages, derived } = await detectPackagesDetailed(rootDir);
  if (derived && path !== null) {
    const entry = { version: CACHE_VERSION2, layout, packages };
    await writeFile2(path, JSON.stringify(entry), "utf8").catch(() => {
    });
  }
  return packages;
}
async function layoutSignature(rootDir) {
  const candidates = [join7(rootDir, "package.json"), join7(rootDir, "pnpm-workspace.yaml")];
  const aliases = await tsconfigPaths(rootDir);
  if (aliases !== null) candidates.push(aliases.file);
  const signature = {};
  for (const file of candidates) {
    const mtime = await mtimeOf2(file);
    if (mtime !== null) signature[file] = mtime;
  }
  return signature;
}
function sameSignature(a, b) {
  if (a === null || typeof a !== "object") return false;
  const keys = Object.keys(b);
  return keys.length === Object.keys(a).length && keys.every((key) => a[key] === b[key]);
}

// src/layers/config.ts
import { readFile as readFile8, writeFile as writeFile3 } from "node:fs/promises";
import { join as join9 } from "node:path";

// src/knowledge/decisions.ts
import { readdir as readdir4, readFile as readFile7, stat as stat5 } from "node:fs/promises";
import { basename as basename3, join as join8, resolve as resolve4 } from "node:path";

// src/knowledge/paths.ts
import { readdir as readdir3 } from "node:fs/promises";
import { resolve as resolve3 } from "node:path";
var KNOWLEDGE_DIR = ".ui-consistency";
var LEGACY_KNOWLEDGE_DIR = ".claude/ui-consistency";
async function knowledgeDir(rootDir, sub = "") {
  const inside = async (base) => {
    const entries = await readdir3(resolve3(rootDir, base, sub)).catch(() => null);
    return entries !== null && entries.length > 0;
  };
  if (await inside(KNOWLEDGE_DIR)) {
    return { dir: resolve3(rootDir, KNOWLEDGE_DIR, sub), legacy: false };
  }
  if (await inside(LEGACY_KNOWLEDGE_DIR)) {
    return { dir: resolve3(rootDir, LEGACY_KNOWLEDGE_DIR, sub), legacy: true };
  }
  return { dir: resolve3(rootDir, KNOWLEDGE_DIR, sub), legacy: false };
}
var MOVED = `${LEGACY_KNOWLEDGE_DIR}/ is the old location and is still read. Move it to ${KNOWLEDGE_DIR}/ \u2014 it is your project's intent, not one agent's configuration.`;

// src/knowledge/decisions.ts
async function readDecisions(rootDir) {
  const { dir } = await knowledgeDir(rootDir, "decisions");
  const entries = await readdir4(dir).catch(() => null);
  if (entries === null) return [];
  const decisions = [];
  for (const entry of entries.filter((name) => /\.md$/i.test(name)).sort()) {
    const path = join8(dir, entry);
    const source = await readFile7(path, "utf8").catch(() => null);
    if (source === null) continue;
    let named2 = null;
    const statements = [];
    const listed = { prefer: [], ignore: [] };
    for (const line of source.split("\n")) {
      const pointer = /^\s*canon\s*:\s*(.+?)\s*$/i.exec(line);
      if (pointer !== null) {
        named2 = pointer[1];
        continue;
      }
      const list2 = /^\s*(prefer|ignore)\s*:\s*(.+?)\s*$/i.exec(line);
      if (list2 !== null) {
        listed[list2[1].toLowerCase()] = list2[2].split(",").map((name) => name.trim()).filter((name) => name !== "");
        continue;
      }
      const statement = /^\s*[-*]\s+(.+?)\s*$/.exec(line);
      if (statement !== null) statements.push(statement[1]);
    }
    const resolved = named2 === null ? null : resolve4(rootDir, named2);
    const exists = resolved === null ? false : await stat5(resolved).then(() => true, () => false);
    decisions.push({
      kind: basename3(entry).replace(/\.md$/i, ""),
      canon: exists ? resolved : null,
      stale: named2 !== null && !exists ? named2 : null,
      statements,
      prefer: listed["prefer"] ?? [],
      ignore: listed["ignore"] ?? [],
      file: path
    });
  }
  return decisions;
}

// src/layers/config.ts
var CONFIG_FILE = ".uicrc.json";
async function readConfig(rootDir) {
  const raw = await readFile8(join9(rootDir, CONFIG_FILE), "utf8").catch(() => null);
  let config = null;
  if (raw !== null) {
    try {
      config = JSON.parse(raw);
    } catch {
      config = null;
    }
  }
  const decided = await readDecisions(rootDir).catch(() => []);
  const prefer = decided.flatMap((one) => one.prefer);
  const ignore = decided.flatMap((one) => one.ignore);
  if (prefer.length === 0 && ignore.length === 0) return config;
  return {
    ...config,
    // Written intent first: it is the more recent place to say it.
    prefer: [...prefer, ...config?.prefer ?? []],
    ignore: [...ignore, ...config?.ignore ?? []]
  };
}
function applyConfig(detected, config) {
  if (config === null) return detected;
  const ignored = new Set(config.ignore ?? []);
  return detected.filter((pkg) => !ignored.has(pkg.name)).map((pkg) => {
    const override = config.packages?.[pkg.name];
    const dependencies = override?.dependencies ?? pkg.dependencies;
    return { ...pkg, dependencies: dependencies.filter((dep) => !ignored.has(dep)) };
  });
}

// src/core/check.ts
var IDENTIFIER = /^[A-Za-z_$][\w$]*$/;
function subpathSymbol(specifier) {
  const segments = specifier.split("/");
  const bareLength = specifier.startsWith("@") ? 2 : 1;
  if (segments.length <= bareLength) return null;
  const last = segments[segments.length - 1];
  return IDENTIFIER.test(last) ? last : null;
}
function staticImports(ast) {
  const found = [];
  for (const statement of ast.program.body) {
    if (statement.type !== "ImportDeclaration") continue;
    if (statement.importKind === "type") continue;
    const specifier = statement.source.value;
    const line = statement.loc?.start.line ?? 1;
    for (const binding of statement.specifiers) {
      if (binding.type === "ImportSpecifier") {
        if (binding.importKind === "type") continue;
        const imported = binding.imported;
        if (imported.type !== "Identifier") continue;
        found.push({ symbol: imported.name, specifier, line });
        continue;
      }
      if (binding.type === "ImportDefaultSpecifier") {
        const symbol = subpathSymbol(specifier);
        if (symbol !== null) found.push({ symbol, specifier, line });
      }
    }
  }
  return found;
}
function reaches(from, to, byName) {
  const seen = /* @__PURE__ */ new Set();
  const queue = [...from.dependencies];
  while (queue.length > 0) {
    const name = queue.pop();
    if (name === to) return true;
    if (seen.has(name)) continue;
    seen.add(name);
    queue.push(...byName.get(name)?.dependencies ?? []);
  }
  return false;
}
function checkSource(filePath, source, chain, inventory2) {
  const own = chain[0];
  if (own === void 0) return [];
  const ast = parseModule(source, filePath);
  if (ast === null) return [];
  const importable = /* @__PURE__ */ new Set([own.name, ...own.dependencies]);
  const ownExports = exportedSymbolsOf(ast);
  const byName = new Map(chain.map((layer) => [layer.name, layer]));
  const violations = [];
  for (const imported of staticImports(ast)) {
    if (ownExports.has(imported.symbol)) continue;
    const from = layerFor(imported.specifier, chain);
    if (from === null) continue;
    const nearest = chain.find(
      (layer) => importable.has(layer.name) && inventory2.layers[layer.name]?.[imported.symbol] !== void 0 && (layer.name === from.name || reaches(layer, from.name, byName))
    );
    if (nearest === void 0) continue;
    const entry = inventory2.layers[nearest.name]?.[imported.symbol];
    if (entry === void 0) continue;
    if (from.name !== nearest.name) {
      violations.push({
        file: filePath,
        line: imported.line,
        symbol: imported.symbol,
        importedFrom: imported.specifier,
        expectedFrom: nearest.name,
        reason: "nearer-layer",
        // Telling a file in @acme/core to `import from '@acme/core'` would be
        // a circular import. The fact still holds; the fix is a path we do not
        // resolve yet, so none is offered.
        ...nearest.name === own.name ? { withinOwnLayer: true } : {}
      });
      continue;
    }
    if (entry.deprecated) {
      violations.push({
        file: filePath,
        line: imported.line,
        symbol: imported.symbol,
        importedFrom: imported.specifier,
        expectedFrom: nearest.name,
        reason: "deprecated",
        ...entry.replacement !== null ? { replacement: entry.replacement } : {}
      });
    }
  }
  return violations;
}

// src/core/format.ts
function formatViolation(v) {
  const lines = [`${v.file}:${v.line}`];
  if (v.reason === "nearer-layer") {
    lines.push(`${v.symbol} is imported from ${v.importedFrom}.`);
    lines.push(`${v.expectedFrom} exports ${v.symbol} and is nearer on this file's chain.`);
    if (v.withinOwnLayer === true) {
      lines.push(`\u2192 this file is in ${v.expectedFrom}; use the layer's own ${v.symbol}.`);
    } else {
      lines.push(`\u2192 import { ${v.symbol} } from '${v.expectedFrom}'`);
    }
    return lines.join("\n");
  }
  lines.push(`${v.symbol} is deprecated in ${v.importedFrom}.`);
  if (v.replacement !== void 0) {
    lines.push(`\u2192 import { ${v.replacement} } from '${v.expectedFrom}'`);
  }
  return lines.join("\n");
}
function formatFinding(finding) {
  if ((finding.level === "import" || finding.level === "deprecated") && finding.reason !== void 0 && finding.symbol !== void 0 && finding.importedFrom !== void 0 && finding.expectedFrom !== void 0) {
    return formatViolation(finding);
  }
  const lines = [`${finding.file}:${finding.line}`, finding.message];
  if (finding.advisory === true && finding.source !== void 0) {
    lines.push(`(advisory, from ${finding.source})`);
  }
  return lines.join("\n");
}
function importSentence(symbols, importedFrom, expectedFrom) {
  const named2 = symbols.length < 2 ? symbols[0] ?? "" : `${symbols.slice(0, -1).join(", ")} and ${symbols[symbols.length - 1]}`;
  return `${named2} ${symbols.length < 2 ? "is" : "are"} imported from ${importedFrom}; ${expectedFrom} is nearer.`;
}
var IMPORT_SENTENCE = /^(.+?) (?:is|are) imported from (.+?); (.+?) is nearer\.$/;
function readImportSentence(message) {
  const match = IMPORT_SENTENCE.exec(message);
  if (match === null) return null;
  return {
    symbols: match[1].split(/, | and /),
    importedFrom: match[2],
    expectedFrom: match[3]
  };
}
var importSourceSentence = (importedFrom, expectedFrom) => `${importedFrom} is imported where ${expectedFrom} is nearer.`;

// src/core/quote.ts
var MAX_QUOTED = 80;
var INVISIBLE = /[\p{Cc}\p{Cf}]/gu;
var COLON = "[:\\uFF1A\\uA789\\u2236\\u02D0\\u0589\\u05C3\\uFE13\\uFE55]";
var OWN_VOICE = new RegExp(`ui-consistency\\s*${COLON}`, "giu");
function quoted(value) {
  const visible = value.replace(INVISIBLE, "");
  const flat = visible.replace(/\s+/gu, " ").trim();
  const defanged = flat.replace(OWN_VOICE, (match) => `${match.slice(0, -1)}\u2060 `);
  const points = [...defanged];
  return points.length > MAX_QUOTED ? `${points.slice(0, MAX_QUOTED).join("")}\u2026` : defanged;
}

// src/checks/css-values.ts
var HEX = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
var COLOUR_FUNCTION = /^(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/i;
var ABSOLUTE_LENGTH = /^-?\d*\.?\d+(?:px|pt|pc|in|cm|mm)$/i;
var ZERO_LENGTH = /^-?0*\.?0*(?:px|pt|pc|in|cm|mm)?$/i;
var isColourValue = (value) => HEX.test(value) || COLOUR_FUNCTION.test(value);
var isLengthValue = (value) => ABSOLUTE_LENGTH.test(value);
var isZeroLength = (value) => ZERO_LENGTH.test(value);
var SIZE_KEYS = /* @__PURE__ */ new Set(["fontSize"]);
var SCALED_IN_SX = /* @__PURE__ */ new Set(["borderRadius", "letterSpacing"]);
var SPACING_KEYS = /* @__PURE__ */ new Set([
  "margin",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "padding",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "gap",
  "rowGap",
  "columnGap",
  "spacing",
  "m",
  "mt",
  "mr",
  "mb",
  "ml",
  "mx",
  "my",
  "p",
  "pt",
  "pr",
  "pb",
  "pl",
  "px",
  "py"
]);
var kebab = (key) => key.replace(/([A-Z])/gu, "-$1").replace(/^-/u, "").toLowerCase();
var LENGTH_PROPERTIES = new Set(
  [...SIZE_KEYS, ...SPACING_KEYS, ...SCALED_IN_SX, "lineHeight"].flatMap((key) => [
    key,
    kebab(key)
  ])
);
var takesLength = (property) => LENGTH_PROPERTIES.has(property) || LENGTH_PROPERTIES.has(kebab(property));

// src/checks/style.ts
var UNITLESS = /* @__PURE__ */ new Set(["lineHeight", "opacity", "zIndex", "flexGrow", "flexShrink", "order"]);
function isRawNumber(attribute, key) {
  if (UNITLESS.has(key)) return false;
  if (SIZE_KEYS.has(key)) return true;
  if (attribute !== "style") return false;
  return SPACING_KEYS.has(key) || SCALED_IN_SX.has(key);
}
function propertyKey(node) {
  if (node.type !== "ObjectProperty" || node.computed) return null;
  const key = node.key;
  if (key.type === "Identifier") return key.name;
  if (key.type === "StringLiteral") return key.value;
  return null;
}
function unwrapNegative(value) {
  if (value.type === "UnaryExpression" && value.operator === "-") {
    return { node: value.argument, negated: true };
  }
  return { node: value, negated: false };
}
function collect2(attribute, object, file, findings) {
  for (const property of object.properties) {
    const key = propertyKey(property);
    if (key === null || property.type !== "ObjectProperty") continue;
    if (property.value.type === "ObjectExpression") {
      collect2(attribute, property.value, file, findings);
      continue;
    }
    const { node, negated } = unwrapNegative(property.value);
    const line = property.loc?.start.line ?? 1;
    if (node.type === "NumericLiteral") {
      if (!isRawNumber(attribute, key) || node.value === 0) continue;
      const shown = `${negated ? "-" : ""}${node.value}`;
      findings.push({
        file,
        line,
        level: "style",
        message: `${quoted(key)}: ${quoted(String(shown))} is a hardcoded value, not a design-system token.`
      });
      continue;
    }
    if (node.type === "StringLiteral") {
      const value = node.value;
      if (isColourValue(value)) {
        findings.push({
          file,
          line,
          level: "style",
          message: `${quoted(key)}: '${quoted(value)}' is a hardcoded colour, not a design-system token.`
        });
        continue;
      }
      if (takesLength(key) && isLengthValue(value) && !isZeroLength(value)) {
        findings.push({
          file,
          line,
          level: "style",
          message: `${quoted(key)}: '${quoted(value)}' is a hardcoded length, not a design-system token.`
        });
      }
      continue;
    }
  }
}
function styleAttributeName(node) {
  if (node.name.type !== "JSXIdentifier") return null;
  const name = node.name.name;
  return name === "sx" || name === "style" ? name : null;
}
function styleFindings(filePath, source) {
  const ast = parseModule(source, filePath);
  if (ast === null) return [];
  const findings = [];
  walk(ast.program, (node) => {
    if (node.type !== "JSXAttribute") return;
    const attribute = styleAttributeName(node);
    const value = node.value;
    if (attribute !== null && value?.type === "JSXExpressionContainer" && value.expression.type === "ObjectExpression") {
      collect2(attribute, value.expression, filePath, findings);
    }
  });
  return findings.sort((a, b) => a.line - b.line);
}

// src/checks/emoji.ts
var EMOJI = /[\u{1F300}-\u{1FAFF}\u{1F000}-\u{1F0FF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{1F900}-\u{1F9FF}]/u;
function isEmojiOnly(text) {
  const trimmed = text.trim();
  if (trimmed === "" || !EMOJI.test(trimmed)) return false;
  return !/[\p{L}\p{N}]/u.test(trimmed);
}
var ICON_SLOTS = /* @__PURE__ */ new Set([
  "icon",
  "startIcon",
  "endIcon",
  "avatar",
  "logo",
  "iconName",
  "leftIcon",
  "rightIcon"
]);
function emojiFinding(file, line, text) {
  return {
    file,
    line,
    level: "reuse",
    message: `${quoted(text)} is an emoji used as an icon. Use the design system's icon component so it matches the others.`
  };
}
function emojiFindings(filePath, source) {
  const ast = parseModule(source, filePath);
  if (ast === null) return [];
  const findings = [];
  walk(ast.program, (node) => {
    if (node.type === "JSXElement") {
      const element = node;
      const line = element.openingElement.loc?.start.line ?? 1;
      for (const child of element.children) {
        if (child.type !== "JSXText") continue;
        if (isEmojiOnly(child.value)) {
          findings.push(emojiFinding(filePath, child.loc?.start.line ?? line, child.value));
        }
      }
      return;
    }
    if (node.type === "JSXAttribute") {
      if (node.name.type !== "JSXIdentifier" || !ICON_SLOTS.has(node.name.name)) return;
      const value = node.value;
      if (value?.type === "StringLiteral" && EMOJI.test(value.value)) {
        findings.push(emojiFinding(filePath, value.loc?.start.line ?? 1, value.value));
      }
    }
  });
  return findings.sort((a, b) => a.line - b.line);
}

// src/checks/props.ts
function componentName(opening) {
  const name = opening.name;
  if (name.type !== "JSXIdentifier") return null;
  return /^[A-Z]/.test(name.name) ? name.name : null;
}
function propFindings(filePath, source, conventions, sourceKind) {
  if (Object.keys(conventions).length === 0) return [];
  const ast = parseModule(source, filePath);
  if (ast === null) return [];
  const findings = [];
  walk(ast.program, (node) => {
    if (node.type !== "JSXOpeningElement") return;
    const component = componentName(node);
    if (component === null) return;
    const known = conventions[component];
    if (known === void 0) return;
    for (const attribute of node.attributes) {
      if (attribute.type !== "JSXAttribute") continue;
      if (attribute.name.type !== "JSXIdentifier") continue;
      const allowed = known[attribute.name.name];
      if (allowed === void 0) continue;
      const value = attribute.value;
      if (value?.type !== "StringLiteral") continue;
      if (allowed.includes(value.value)) continue;
      findings.push({
        file: filePath,
        line: attribute.loc?.start.line ?? 1,
        level: "props",
        message: `${component} ${attribute.name.name}="${quoted(value.value)}" is not one of ${allowed.map((v) => `"${quoted(v)}"`).join(", ")}.`,
        ...sourceKind === void 0 ? {} : { source: sourceKind }
      });
    }
  });
  return findings.sort((a, b) => a.line - b.line);
}

// src/checks/deprecated-usage.ts
function importedComponents(ast, chain) {
  const found = /* @__PURE__ */ new Map();
  for (const statement of ast.program.body) {
    if (statement.type !== "ImportDeclaration") continue;
    if (statement.importKind === "type") continue;
    const layer = layerFor(statement.source.value, chain);
    if (layer === null) continue;
    for (const binding of statement.specifiers) {
      if (binding.type !== "ImportSpecifier") continue;
      if (binding.importKind === "type") continue;
      const imported = binding.imported;
      if (imported.type !== "Identifier") continue;
      found.set(binding.local.name, { symbol: imported.name, layer: layer.name });
    }
  }
  return found;
}
function deprecatedUsageFindings(filePath, source, chain, inventory2) {
  if (chain.length === 0) return [];
  const ast = parseModule(source, filePath);
  if (ast === null) return [];
  const imported = importedComponents(ast, chain);
  if (imported.size === 0) return [];
  const findings = [];
  walk(ast.program, (node) => {
    if (node.type !== "JSXOpeningElement") return;
    if (node.name.type !== "JSXIdentifier") return;
    const origin = imported.get(node.name.name);
    if (origin === void 0) return;
    const entry = inventory2.layers[origin.layer]?.[origin.symbol];
    if (entry === void 0 || !entry.deprecated) return;
    const replacement = entry.replacement;
    findings.push({
      file: filePath,
      line: node.loc?.start.line ?? 1,
      level: "deprecated",
      symbol: origin.symbol,
      expectedFrom: origin.layer,
      message: replacement === null ? `${origin.symbol} is deprecated in ${origin.layer}.` : `${origin.symbol} is deprecated in ${origin.layer}. Use ${replacement} instead.`,
      ...replacement === null ? {} : { replacement }
    });
  });
  return findings.sort((a, b) => a.line - b.line);
}

// src/knowledge/parse.ts
import { readdir as readdir5, readFile as readFile9 } from "node:fs/promises";
import { basename as basename4, join as join10 } from "node:path";
var STOPWORDS = /* @__PURE__ */ new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "but",
  "by",
  "do",
  "does",
  "every",
  "for",
  "from",
  "has",
  "have",
  "in",
  "into",
  "is",
  "it",
  "its",
  "never",
  "no",
  "not",
  "of",
  "on",
  "only",
  "or",
  "own",
  "so",
  "that",
  "the",
  "their",
  "them",
  "then",
  "there",
  "they",
  "this",
  "to",
  "use",
  "used",
  "was",
  "which",
  "will",
  "with"
]);
function headingLevel(line) {
  const match = /^(#{1,6})\s+/.exec(line);
  return match === null ? 0 : match[1].length;
}
function slug(text) {
  return text.toLowerCase().replace(/[^\w]+/g, "-").replace(/^-|-$/g, "");
}
function keywordsOf(heading, body) {
  const found = /* @__PURE__ */ new Set();
  const add = (raw) => {
    const term = raw.toLowerCase();
    if (term.length < 2 || STOPWORDS.has(term)) return;
    found.add(term);
  };
  const packages = /@[\w.-]+\/[\w.-]+/g;
  for (const match of `${heading}
${body}`.matchAll(packages)) add(match[0]);
  for (const match of body.matchAll(/`([^`]+)`/g)) {
    for (const word of match[1].split(/[^\w@/.-]+/)) {
      if (word.includes("/") && !word.startsWith("@")) continue;
      add(word);
    }
  }
  for (const match of body.matchAll(/\*\*([^*]+)\*\*|\*([^*]+)\*/g)) {
    for (const word of (match[1] ?? match[2] ?? "").split(/[^\w-]+/)) add(word);
  }
  for (const word of heading.split(/[^\w@/-]+/)) add(word);
  return [...found];
}
var MARKER = /<!--\s*uic:generated\b[^>]*-->/i;
var MARKER_WINDOW = 512;
function isGenerated2(source) {
  return MARKER.test(source.slice(0, MARKER_WINDOW));
}
function generatedVersion(source) {
  const marker = MARKER.exec(source.slice(0, MARKER_WINDOW));
  if (marker === null) return null;
  return /\bv=([\w.-]+)/.exec(marker[0])?.[1] ?? null;
}
function withoutComments(source) {
  return source.replace(/<!--[\s\S]*?-->/g, "");
}
function fragmentsFromFile(fileName, source) {
  const kind = basename4(fileName).replace(/\.md$/i, "");
  const generated = isGenerated2(source);
  const lines = withoutComments(source).split("\n");
  const fragments = [];
  let subject = null;
  let body = [];
  const flush = () => {
    if (subject === null) return;
    const text = body.join("\n").trim();
    fragments.push({
      id: `${kind}#${slug(subject)}`,
      kind,
      subject,
      body: text,
      keywords: keywordsOf(subject, text),
      ...generated ? { generated: true } : {}
    });
    body = [];
  };
  for (const line of lines) {
    const level = headingLevel(line);
    if (level === 0) {
      body.push(line);
      continue;
    }
    flush();
    subject = line.slice(level).trim();
  }
  flush();
  return fragments.filter((fragment) => fragment.body !== "");
}
async function parseKnowledge(dir) {
  const entries = await readdir5(dir).catch(() => null);
  if (entries === null) return { fragments: [] };
  const fragments = [];
  for (const entry of entries.filter((name) => /\.md$/i.test(name)).sort()) {
    const source = await readFile9(join10(dir, entry), "utf8").catch(() => null);
    if (source === null) continue;
    fragments.push(...fragmentsFromFile(entry, source));
  }
  return { fragments };
}

// src/knowledge/retrieve.ts
var GENERIC = /* @__PURE__ */ new Set([
  "component",
  "components",
  "element",
  "index",
  "src",
  "lib",
  "ui",
  "common",
  "shared",
  "utils",
  "helper",
  "helpers",
  "view",
  "app",
  "core"
]);
function isDistinctive(term) {
  return term.length > 1 && !STOPWORDS.has(term) && !GENERIC.has(term);
}
var DEFAULTS = {
  maxFragments: 4,
  maxChars: 2e3
};
var SUBJECT_WEIGHT = 3;
var KIND_WEIGHT = 4;
var BODY_WEIGHT = 1;
var RELEVANCE_FLOOR = SUBJECT_WEIGHT;
function termsOfIdentifier(identifier) {
  const terms = [identifier.toLowerCase()];
  for (const part of identifier.split(/(?=[A-Z])|[^A-Za-z0-9]+/)) {
    if (part.length > 1) terms.push(part.toLowerCase());
  }
  return terms;
}
function fold(term) {
  return term.length > 3 && term.endsWith("s") ? term.slice(0, -1) : term;
}
function termsOfSource(source) {
  const ast = parseModule(source);
  if (ast === null) return /* @__PURE__ */ new Set();
  const terms = /* @__PURE__ */ new Set();
  const add = (raw) => {
    for (const term of termsOfIdentifier(raw)) terms.add(fold(term));
  };
  for (const statement of ast.program.body) {
    if (statement.type === "ImportDeclaration") {
      const specifier = statement.source.value;
      terms.add(specifier.toLowerCase());
      if (!specifier.startsWith(".")) {
        for (const segment of specifier.split("/")) add(segment);
      }
      for (const binding of statement.specifiers) add(binding.local.name);
      continue;
    }
    const declaration = statement.type === "ExportNamedDeclaration" || statement.type === "ExportDefaultDeclaration" ? statement.declaration : statement;
    if (declaration === null || declaration === void 0) continue;
    if (declaration.type === "FunctionDeclaration" && declaration.id != null) {
      add(declaration.id.name);
    }
    if (declaration.type === "VariableDeclaration") {
      for (const declarator of declaration.declarations) {
        if (declarator.id.type === "Identifier") add(declarator.id.name);
      }
    }
  }
  walk(ast.program, (node) => {
    if (node.type === "JSXOpeningElement" && node.name.type === "JSXIdentifier") {
      add(node.name.name);
    }
  });
  return terms;
}
function score(fragment, terms) {
  let aboutness = 0;
  let incidental = 0;
  for (const part of termsOfIdentifier(fragment.kind)) {
    if (isDistinctive(part) && terms.has(fold(part))) aboutness += KIND_WEIGHT;
  }
  for (const word of fragment.subject.split(/[^\w@/-]+/)) {
    const term = word.toLowerCase();
    if (isDistinctive(term) && terms.has(fold(term))) aboutness += SUBJECT_WEIGHT;
  }
  for (const keyword of fragment.keywords) {
    if (terms.has(fold(keyword))) incidental += BODY_WEIGHT;
  }
  return aboutness >= RELEVANCE_FLOOR ? aboutness + incidental : 0;
}
function retrieve(source, knowledge, options = {}) {
  const { maxFragments, maxChars } = { ...DEFAULTS, ...options };
  if (knowledge.fragments.length === 0) return [];
  const terms = termsOfSource(source);
  for (const term of options.terms ?? []) {
    for (const part of termsOfIdentifier(term)) terms.add(fold(part));
  }
  if (options.filePath !== void 0) {
    const base = options.filePath.split("/").pop() ?? "";
    for (const term of termsOfIdentifier(base.replace(/\.[jt]sx?$/, ""))) terms.add(fold(term));
  }
  if (terms.size === 0) return [];
  const ranked = knowledge.fragments.map((fragment) => ({ fragment, score: score(fragment, terms) })).filter((entry) => entry.score > 0).sort((a, b) => b.score - a.score);
  const chosen = [];
  let used = 0;
  for (const { fragment } of ranked) {
    if (chosen.length >= maxFragments) break;
    if (used + fragment.body.length > maxChars) continue;
    chosen.push(fragment);
    used += fragment.body.length;
  }
  return chosen;
}

// src/knowledge/rules.ts
var NEGATION = /\b(never|not|instead of|rather than|avoid|don't|do not)\b/i;
var COMPONENT = /<([A-Z][\w]*|[a-z][\w]*-[\w-]*)|`<?([A-Z][\w]*|[a-z][\w]*-[\w-]*)>?`/g;
function componentsIn(text) {
  const found = [];
  for (const match of text.matchAll(COMPONENT)) {
    const name = match[1] ?? match[2];
    if (name !== void 0 && !found.includes(name)) found.push(name);
  }
  return found;
}
function substitutionRules(knowledge) {
  const rules = [];
  for (const fragment of knowledge.fragments) {
    if (fragment.generated === true) continue;
    let canonical2 = null;
    const forbidden = [];
    for (const sentence of fragment.body.split(/(?<=[.;:])\s+|\n{2,}/)) {
      const negation = NEGATION.exec(sentence);
      if (negation === null) {
        const named2 = componentsIn(sentence);
        if (named2.length > 0) canonical2 = named2[0];
        continue;
      }
      const before = componentsIn(sentence.slice(0, negation.index));
      const after = componentsIn(sentence.slice(negation.index));
      if (before.length > 0) canonical2 = before[0];
      if (canonical2 === null) continue;
      for (const name of after) {
        if (name !== canonical2 && !forbidden.includes(name)) forbidden.push(name);
      }
    }
    if (canonical2 !== null && forbidden.length > 0) {
      rules.push({ canonical: canonical2, forbidden, subject: fragment.subject, id: fragment.id });
    }
  }
  return rules;
}

// src/checks/substitution.ts
function reachableExporter(symbol, chain, inventory2) {
  const own = chain[0];
  if (own === void 0) return null;
  const importable = /* @__PURE__ */ new Set([own.name, ...own.dependencies]);
  for (const layer of chain) {
    if (!importable.has(layer.name)) continue;
    const entry = inventory2.layers[layer.name]?.[symbol];
    if (entry !== void 0 && !entry.deprecated) return layer.name;
  }
  return null;
}
function substitutionFindings(filePath, source, rules, chain, inventory2) {
  if (rules.length === 0 || chain.length === 0) return [];
  const ast = parseModule(source, filePath);
  if (ast === null) return [];
  const ownExports = exportedSymbolsOf(ast);
  const wanted = /* @__PURE__ */ new Map();
  for (const rule of rules) {
    if (ownExports.has(rule.canonical)) continue;
    const from = reachableExporter(rule.canonical, chain, inventory2);
    if (from === null) continue;
    for (const name of rule.forbidden) {
      if (!wanted.has(name)) wanted.set(name, { rule, from });
    }
  }
  if (wanted.size === 0) return [];
  const findings = [];
  walk(ast.program, (node) => {
    if (node.type !== "JSXOpeningElement") return;
    if (node.name.type !== "JSXIdentifier") return;
    const match = wanted.get(node.name.name);
    if (match === void 0) return;
    findings.push({
      file: filePath,
      line: node.loc?.start.line ?? 1,
      level: "reuse",
      source: "knowledge",
      symbol: node.name.name,
      expectedFrom: match.from,
      message: `<${quoted(node.name.name)}> is not what this project uses here. "${quoted(match.rule.subject)}" says to use ${quoted(match.rule.canonical)}, which ${quoted(match.from)} exports.`
    });
  });
  return findings.sort((a, b) => a.line - b.line);
}

// node_modules/angular-html-parser/dist/compiler/src/ml_parser/tags.mjs
function splitNsName(elementName2, fatal = true) {
  if (elementName2[0] != ":") return [null, elementName2];
  const colonIndex = elementName2.indexOf(":", 1);
  if (colonIndex === -1) if (fatal) throw new Error(`Unsupported format "${elementName2}" expecting ":namespace:name"`);
  else return [null, elementName2];
  return [elementName2.slice(1, colonIndex), elementName2.slice(colonIndex + 1)];
}
function isNgContainer(tagName) {
  return splitNsName(tagName)[1] === "ng-container";
}
function isNgContent(tagName) {
  return splitNsName(tagName)[1] === "ng-content";
}
function getNsPrefix(fullName) {
  return fullName === null ? null : splitNsName(fullName)[0];
}
function mergeNsAndName(prefix2, localName) {
  return prefix2 ? `:${prefix2}:${localName}` : localName;
}

// node_modules/angular-html-parser/dist/compiler/src/schema/dom_security_schema.mjs
var _SECURITY_SCHEMA;
var SVG_NAMESPACE = "svg";
var MATH_ML_NAMESPACE = "math";
var NO_NAMESPACE = "";
var MATCH_ALL_ELEMENTS = "*";
var createNullObj = () => /* @__PURE__ */ Object.create(null);
function SECURITY_SCHEMA() {
  if (_SECURITY_SCHEMA) return _SECURITY_SCHEMA;
  _SECURITY_SCHEMA = createNullObj();
  registerContext(
    1,
    /** Namespace */
    void 0,
    [["iframe", ["srcdoc"]], ["*", ["innerHTML", "outerHTML"]]]
  );
  registerContext(
    2,
    /** Namespace */
    void 0,
    [["*", ["style"]]]
  );
  registerContext(
    4,
    /** Namespace */
    void 0,
    [
      ["*", ["formAction"]],
      ["area", ["href"]],
      ["a", ["href", "xlink:href"]],
      ["form", ["action"]],
      ["img", ["src"]],
      ["video", ["src"]]
    ]
  );
  registerContext(4, MATH_ML_NAMESPACE, [["*", ["href", "xlink:href"]]]);
  registerContext(
    5,
    /** Namespace */
    void 0,
    [
      ["base", ["href"]],
      ["embed", ["src"]],
      ["frame", ["src"]],
      ["iframe", ["src"]],
      ["link", ["href"]],
      ["object", ["codebase", "data"]]
    ]
  );
  registerContext(4, SVG_NAMESPACE, [["a", ["href", "xlink:href"]]]);
  registerContext(6, SVG_NAMESPACE, [
    ["animate", [
      "attributeName",
      "values",
      "to",
      "from"
    ]],
    ["set", ["to", "attributeName"]],
    ["animateMotion", ["attributeName"]],
    ["animateTransform", ["attributeName"]]
  ]);
  registerContext(
    6,
    /** Namespace */
    void 0,
    [["unknown", [
      "attributeName",
      "values",
      "to",
      "from",
      "sandbox",
      "allow",
      "allowFullscreen",
      "referrerPolicy",
      "csp",
      "fetchPriority",
      "credentialless"
    ]], ["iframe", [
      "sandbox",
      "allow",
      "allowFullscreen",
      "referrerPolicy",
      "csp",
      "fetchPriority",
      "credentialless"
    ]]]
  );
  return _SECURITY_SCHEMA;
}
function registerContext(ctx, namespace, specs) {
  const nsKey = namespace ?? NO_NAMESPACE;
  for (const [element, attributeNames] of specs) {
    const tagName = element.toLowerCase();
    for (const attr of attributeNames) {
      var _SECURITY_SCHEMA2;
      const attrLower = attr.toLowerCase();
      const attrSchema = (_SECURITY_SCHEMA2 = _SECURITY_SCHEMA)[attrLower] ?? (_SECURITY_SCHEMA2[attrLower] = createNullObj());
      const nsSchema = attrSchema[nsKey] ?? (attrSchema[nsKey] = createNullObj());
      nsSchema[tagName] = ctx;
    }
  }
}
function checkSecurityContext(tagName, propName, namespace) {
  const attrSchema = SECURITY_SCHEMA()[propName.toLowerCase()];
  if (!attrSchema) return 0;
  const tagLower = tagName.toLowerCase();
  let context;
  if (namespace) {
    const nsSchema = attrSchema[namespace];
    if (nsSchema) context = nsSchema[tagLower] ?? nsSchema[MATCH_ALL_ELEMENTS];
  }
  if (context === void 0) {
    const defaultSchema = attrSchema[NO_NAMESPACE];
    if (defaultSchema) context = defaultSchema[tagLower] ?? defaultSchema[MATCH_ALL_ELEMENTS];
  }
  return context ?? 0;
}

// node_modules/angular-html-parser/dist/compiler/src/core.mjs
var CUSTOM_ELEMENTS_SCHEMA = { name: "custom-elements" };
var NO_ERRORS_SCHEMA = { name: "no-errors-schema" };

// node_modules/angular-html-parser/dist/compiler/src/util.mjs
var DASH_CASE_REGEXP = /-+([a-z0-9])/g;
function dashCaseToCamelCase(input) {
  return input.replace(DASH_CASE_REGEXP, (...m) => m[1].toUpperCase());
}

// node_modules/angular-html-parser/dist/compiler/src/schema/element_schema_registry.mjs
var ElementSchemaRegistry = class {
};

// node_modules/angular-html-parser/dist/compiler/src/schema/dom_element_schema_registry.mjs
var BOOLEAN = "boolean";
var NUMBER = "number";
var STRING = "string";
var OBJECT = "object";
function normalizeTagName(tagName) {
  const [ns, name] = splitNsName(tagName.toLowerCase(), false);
  return ns === "svg" || ns === "math" ? `:${ns}:${name}` : name;
}
var SCHEMA = [
  "[Element]|textContent,%ariaActiveDescendantElement,%ariaAtomic,%ariaAutoComplete,%ariaBusy,%ariaChecked,%ariaColCount,%ariaColIndex,%ariaColIndexText,%ariaColSpan,%ariaControlsElements,%ariaCurrent,%ariaDescribedByElements,%ariaDescription,%ariaDetailsElements,%ariaDisabled,%ariaErrorMessageElements,%ariaExpanded,%ariaFlowToElements,%ariaHasPopup,%ariaHidden,%ariaInvalid,%ariaKeyShortcuts,%ariaLabel,%ariaLabelledByElements,%ariaLevel,%ariaLive,%ariaModal,%ariaMultiLine,%ariaMultiSelectable,%ariaOrientation,%ariaOwnsElements,%ariaPlaceholder,%ariaPosInSet,%ariaPressed,%ariaReadOnly,%ariaRelevant,%ariaRequired,%ariaRoleDescription,%ariaRowCount,%ariaRowIndex,%ariaRowIndexText,%ariaRowSpan,%ariaSelected,%ariaSetSize,%ariaSort,%ariaValueMax,%ariaValueMin,%ariaValueNow,%ariaValueText,%classList,className,elementTiming,id,innerHTML,*beforecopy,*beforecut,*beforepaste,*fullscreenchange,*fullscreenerror,*search,*webkitfullscreenchange,*webkitfullscreenerror,outerHTML,%part,#scrollLeft,#scrollTop,slot,*message,*mozfullscreenchange,*mozfullscreenerror,*mozpointerlockchange,*mozpointerlockerror,*webglcontextcreationerror,*webglcontextlost,*webglcontextrestored",
  "[HTMLElement]^[Element]|accessKey,autocapitalize,!autofocus,contentEditable,dir,!draggable,enterKeyHint,!hidden,!inert,innerText,inputMode,lang,nonce,*abort,*animationend,*animationiteration,*animationstart,*auxclick,*beforexrselect,*blur,*cancel,*canplay,*canplaythrough,*change,*click,*close,*contextmenu,*copy,*cuechange,*cut,*dblclick,*drag,*dragend,*dragenter,*dragleave,*dragover,*dragstart,*drop,*durationchange,*emptied,*ended,*error,*focus,*formdata,*gotpointercapture,*input,*invalid,*keydown,*keypress,*keyup,*load,*loadeddata,*loadedmetadata,*loadstart,*lostpointercapture,*mousedown,*mouseenter,*mouseleave,*mousemove,*mouseout,*mouseover,*mouseup,*mousewheel,*paste,*pause,*play,*playing,*pointercancel,*pointerdown,*pointerenter,*pointerleave,*pointermove,*pointerout,*pointerover,*pointerrawupdate,*pointerup,*progress,*ratechange,*reset,*resize,*scroll,*securitypolicyviolation,*seeked,*seeking,*select,*selectionchange,*selectstart,*slotchange,*stalled,*submit,*suspend,*timeupdate,*toggle,*transitioncancel,*transitionend,*transitionrun,*transitionstart,*volumechange,*waiting,*webkitanimationend,*webkitanimationiteration,*webkitanimationstart,*webkittransitionend,*wheel,outerText,!spellcheck,%style,#tabIndex,title,!translate,virtualKeyboardPolicy",
  "abbr,address,article,aside,b,bdi,bdo,cite,content,code,dd,dfn,dt,em,figcaption,figure,footer,header,hgroup,i,kbd,main,mark,nav,noscript,rb,rp,rt,rtc,ruby,s,samp,search,section,small,strong,sub,sup,u,var,wbr^[HTMLElement]|accessKey,autocapitalize,!autofocus,contentEditable,dir,!draggable,enterKeyHint,!hidden,innerText,inputMode,lang,nonce,*abort,*animationend,*animationiteration,*animationstart,*auxclick,*beforexrselect,*blur,*cancel,*canplay,*canplaythrough,*change,*click,*close,*contextmenu,*copy,*cuechange,*cut,*dblclick,*drag,*dragend,*dragenter,*dragleave,*dragover,*dragstart,*drop,*durationchange,*emptied,*ended,*error,*focus,*formdata,*gotpointercapture,*input,*invalid,*keydown,*keypress,*keyup,*load,*loadeddata,*loadedmetadata,*loadstart,*lostpointercapture,*mousedown,*mouseenter,*mouseleave,*mousemove,*mouseout,*mouseover,*mouseup,*mousewheel,*paste,*pause,*play,*playing,*pointercancel,*pointerdown,*pointerenter,*pointerleave,*pointermove,*pointerout,*pointerover,*pointerrawupdate,*pointerup,*progress,*ratechange,*reset,*resize,*scroll,*securitypolicyviolation,*seeked,*seeking,*select,*selectionchange,*selectstart,*slotchange,*stalled,*submit,*suspend,*timeupdate,*toggle,*transitioncancel,*transitionend,*transitionrun,*transitionstart,*volumechange,*waiting,*webkitanimationend,*webkitanimationiteration,*webkitanimationstart,*webkittransitionend,*wheel,outerText,!spellcheck,%style,#tabIndex,title,!translate,virtualKeyboardPolicy",
  "media^[HTMLElement]|!autoplay,!controls,%controlsList,%crossOrigin,#currentTime,!defaultMuted,#defaultPlaybackRate,!disableRemotePlayback,!loop,!muted,*encrypted,*waitingforkey,#playbackRate,preload,!preservesPitch,src,%srcObject,#volume",
  ":svg:^[HTMLElement]|!autofocus,nonce,*abort,*animationend,*animationiteration,*animationstart,*auxclick,*beforexrselect,*blur,*cancel,*canplay,*canplaythrough,*change,*click,*close,*contextmenu,*copy,*cuechange,*cut,*dblclick,*drag,*dragend,*dragenter,*dragleave,*dragover,*dragstart,*drop,*durationchange,*emptied,*ended,*error,*focus,*formdata,*gotpointercapture,*input,*invalid,*keydown,*keypress,*keyup,*load,*loadeddata,*loadedmetadata,*loadstart,*lostpointercapture,*mousedown,*mouseenter,*mouseleave,*mousemove,*mouseout,*mouseover,*mouseup,*mousewheel,*paste,*pause,*play,*playing,*pointercancel,*pointerdown,*pointerenter,*pointerleave,*pointermove,*pointerout,*pointerover,*pointerrawupdate,*pointerup,*progress,*ratechange,*reset,*resize,*scroll,*securitypolicyviolation,*seeked,*seeking,*select,*selectionchange,*selectstart,*slotchange,*stalled,*submit,*suspend,*timeupdate,*toggle,*transitioncancel,*transitionend,*transitionrun,*transitionstart,*volumechange,*waiting,*webkitanimationend,*webkitanimationiteration,*webkitanimationstart,*webkittransitionend,*wheel,%style,#tabIndex",
  ":svg:graphics^:svg:|",
  ":svg:animation^:svg:|*begin,*end,*repeat",
  ":svg:geometry^:svg:|",
  ":svg:componentTransferFunction^:svg:|",
  ":svg:gradient^:svg:|",
  ":svg:textContent^:svg:graphics|",
  ":svg:textPositioning^:svg:textContent|",
  "a^[HTMLElement]|charset,coords,download,hash,host,hostname,href,hreflang,name,password,pathname,ping,port,protocol,referrerPolicy,rel,%relList,rev,search,shape,target,text,type,username",
  "area^[HTMLElement]|alt,coords,download,hash,host,hostname,href,!noHref,password,pathname,ping,port,protocol,referrerPolicy,rel,%relList,search,shape,target,username",
  "audio^media|",
  "br^[HTMLElement]|clear",
  "base^[HTMLElement]|href,target",
  "body^[HTMLElement]|aLink,background,bgColor,link,*afterprint,*beforeprint,*beforeunload,*blur,*error,*focus,*hashchange,*languagechange,*load,*message,*messageerror,*offline,*online,*pagehide,*pageshow,*popstate,*rejectionhandled,*resize,*scroll,*storage,*unhandledrejection,*unload,text,vLink",
  "button^[HTMLElement]|!disabled,formAction,formEnctype,formMethod,!formNoValidate,formTarget,name,type,value",
  "canvas^[HTMLElement]|#height,#width",
  "content^[HTMLElement]|select",
  "dl^[HTMLElement]|!compact",
  "data^[HTMLElement]|value",
  "datalist^[HTMLElement]|",
  "details^[HTMLElement]|!open",
  "dialog^[HTMLElement]|!open,returnValue",
  "dir^[HTMLElement]|!compact",
  "div^[HTMLElement]|align",
  "embed^[HTMLElement]|align,height,name,src,type,width",
  "fieldset^[HTMLElement]|!disabled,name",
  "font^[HTMLElement]|color,face,size",
  "form^[HTMLElement]|acceptCharset,action,autocomplete,encoding,enctype,method,name,!noValidate,target",
  "frame^[HTMLElement]|frameBorder,longDesc,marginHeight,marginWidth,name,!noResize,scrolling,src",
  "frameset^[HTMLElement]|cols,*afterprint,*beforeprint,*beforeunload,*blur,*error,*focus,*hashchange,*languagechange,*load,*message,*messageerror,*offline,*online,*pagehide,*pageshow,*popstate,*rejectionhandled,*resize,*scroll,*storage,*unhandledrejection,*unload,rows",
  "geolocation^[HTMLElement]|accuracymode,!autolocate,*location,*promptaction,*promptdismiss,*validationstatuschange,!watch",
  "hr^[HTMLElement]|align,color,!noShade,size,width",
  "head^[HTMLElement]|",
  "h1,h2,h3,h4,h5,h6^[HTMLElement]|align",
  "html^[HTMLElement]|version",
  "iframe^[HTMLElement]|align,allow,!allowFullscreen,!allowPaymentRequest,csp,!credentialless,frameBorder,height,loading,longDesc,marginHeight,marginWidth,name,referrerPolicy,%sandbox,scrolling,src,srcdoc,width",
  "img^[HTMLElement]|align,alt,border,%crossOrigin,decoding,#height,#hspace,!isMap,loading,longDesc,lowsrc,name,referrerPolicy,sizes,src,srcset,useMap,#vspace,#width",
  "input^[HTMLElement]|accept,align,alt,autocomplete,!checked,!defaultChecked,defaultValue,dirName,!disabled,%files,formAction,formEnctype,formMethod,!formNoValidate,formTarget,#height,!incremental,!indeterminate,max,#maxLength,min,#minLength,!multiple,name,pattern,placeholder,!readOnly,!required,selectionDirection,#selectionEnd,#selectionStart,#size,src,step,type,useMap,value,%valueAsDate,#valueAsNumber,#width",
  "li^[HTMLElement]|type,#value",
  "label^[HTMLElement]|htmlFor",
  "legend^[HTMLElement]|align",
  "link^[HTMLElement]|as,charset,%crossOrigin,!disabled,href,hreflang,imageSizes,imageSrcset,integrity,media,referrerPolicy,rel,%relList,rev,%sizes,target,type",
  "map^[HTMLElement]|name",
  "marquee^[HTMLElement]|behavior,bgColor,direction,height,#hspace,#loop,#scrollAmount,#scrollDelay,!trueSpeed,#vspace,width",
  "menu^[HTMLElement]|!compact",
  "meta^[HTMLElement]|content,httpEquiv,media,name,scheme",
  "meter^[HTMLElement]|#high,#low,#max,#min,#optimum,#value",
  "ins,del^[HTMLElement]|cite,dateTime",
  "ol^[HTMLElement]|!compact,!reversed,#start,type",
  "object^[HTMLElement]|align,archive,border,code,codeBase,codeType,data,!declare,height,#hspace,name,standby,type,useMap,#vspace,width",
  "optgroup^[HTMLElement]|!disabled,label",
  "option^[HTMLElement]|!defaultSelected,!disabled,label,!selected,text,value",
  "output^[HTMLElement]|defaultValue,%htmlFor,name,value",
  "p^[HTMLElement]|align",
  "param^[HTMLElement]|name,type,value,valueType",
  "picture^[HTMLElement]|",
  "pre^[HTMLElement]|#width",
  "progress^[HTMLElement]|#max,#value",
  "q,blockquote,cite^[HTMLElement]|",
  "script^[HTMLElement]|!async,charset,%crossOrigin,!defer,event,htmlFor,integrity,!noModule,%referrerPolicy,src,text,type",
  "select^[HTMLElement]|autocomplete,!disabled,#length,!multiple,name,!required,#selectedIndex,#size,value",
  "selectedcontent^[HTMLElement]|",
  "slot^[HTMLElement]|name",
  "source^[HTMLElement]|#height,media,sizes,src,srcset,type,#width",
  "span^[HTMLElement]|",
  "style^[HTMLElement]|!disabled,media,type",
  "search^[HTMLELement]|",
  "caption^[HTMLElement]|align",
  "th,td^[HTMLElement]|abbr,align,axis,bgColor,ch,chOff,#colSpan,headers,height,!noWrap,#rowSpan,scope,vAlign,width",
  "col,colgroup^[HTMLElement]|align,ch,chOff,#span,vAlign,width",
  "table^[HTMLElement]|align,bgColor,border,%caption,cellPadding,cellSpacing,frame,rules,summary,%tFoot,%tHead,width",
  "tr^[HTMLElement]|align,bgColor,ch,chOff,vAlign",
  "tfoot,thead,tbody^[HTMLElement]|align,ch,chOff,vAlign",
  "template^[HTMLElement]|",
  "textarea^[HTMLElement]|autocomplete,#cols,defaultValue,dirName,!disabled,#maxLength,#minLength,name,placeholder,!readOnly,!required,#rows,selectionDirection,#selectionEnd,#selectionStart,value,wrap",
  "time^[HTMLElement]|dateTime",
  "title^[HTMLElement]|text",
  "track^[HTMLElement]|!default,kind,label,src,srclang",
  "ul^[HTMLElement]|!compact,type",
  "unknown^[HTMLElement]|",
  "video^media|!disablePictureInPicture,#height,*enterpictureinpicture,*leavepictureinpicture,!playsInline,poster,#width",
  ":svg:a^:svg:graphics|",
  ":svg:animate^:svg:animation|",
  ":svg:animateMotion^:svg:animation|",
  ":svg:animateTransform^:svg:animation|",
  ":svg:circle^:svg:geometry|",
  ":svg:clipPath^:svg:graphics|",
  ":svg:defs^:svg:graphics|",
  ":svg:desc^:svg:|",
  ":svg:discard^:svg:|",
  ":svg:ellipse^:svg:geometry|",
  ":svg:feBlend^:svg:|",
  ":svg:feColorMatrix^:svg:|",
  ":svg:feComponentTransfer^:svg:|",
  ":svg:feComposite^:svg:|",
  ":svg:feConvolveMatrix^:svg:|",
  ":svg:feDiffuseLighting^:svg:|",
  ":svg:feDisplacementMap^:svg:|",
  ":svg:feDistantLight^:svg:|",
  ":svg:feDropShadow^:svg:|",
  ":svg:feFlood^:svg:|",
  ":svg:feFuncA^:svg:componentTransferFunction|",
  ":svg:feFuncB^:svg:componentTransferFunction|",
  ":svg:feFuncG^:svg:componentTransferFunction|",
  ":svg:feFuncR^:svg:componentTransferFunction|",
  ":svg:feGaussianBlur^:svg:|",
  ":svg:feImage^:svg:|",
  ":svg:feMerge^:svg:|",
  ":svg:feMergeNode^:svg:|",
  ":svg:feMorphology^:svg:|",
  ":svg:feOffset^:svg:|",
  ":svg:fePointLight^:svg:|",
  ":svg:feSpecularLighting^:svg:|",
  ":svg:feSpotLight^:svg:|",
  ":svg:feTile^:svg:|",
  ":svg:feTurbulence^:svg:|",
  ":svg:filter^:svg:|",
  ":svg:foreignObject^:svg:graphics|",
  ":svg:g^:svg:graphics|",
  ":svg:image^:svg:graphics|decoding",
  ":svg:line^:svg:geometry|",
  ":svg:linearGradient^:svg:gradient|",
  ":svg:mpath^:svg:|",
  ":svg:marker^:svg:|",
  ":svg:mask^:svg:|",
  ":svg:metadata^:svg:|",
  ":svg:path^:svg:geometry|",
  ":svg:pattern^:svg:|",
  ":svg:polygon^:svg:geometry|",
  ":svg:polyline^:svg:geometry|",
  ":svg:radialGradient^:svg:gradient|",
  ":svg:rect^:svg:geometry|",
  ":svg:svg^:svg:graphics|#currentScale,#zoomAndPan",
  ":svg:script^:svg:|type",
  ":svg:set^:svg:animation|",
  ":svg:stop^:svg:|",
  ":svg:style^:svg:|!disabled,media,title,type",
  ":svg:switch^:svg:graphics|",
  ":svg:symbol^:svg:|",
  ":svg:tspan^:svg:textPositioning|",
  ":svg:text^:svg:textPositioning|",
  ":svg:textPath^:svg:textContent|",
  ":svg:title^:svg:|",
  ":svg:use^:svg:graphics|",
  ":svg:view^:svg:|#zoomAndPan",
  "data^[HTMLElement]|value",
  "keygen^[HTMLElement]|!autofocus,challenge,!disabled,form,keytype,name",
  "menuitem^[HTMLElement]|type,label,icon,!disabled,!checked,radiogroup,!default",
  "summary^[HTMLElement]|",
  "time^[HTMLElement]|dateTime",
  ":svg:cursor^:svg:|",
  ":math:^[HTMLElement]|!autofocus,nonce,*abort,*animationend,*animationiteration,*animationstart,*auxclick,*beforeinput,*beforematch,*beforetoggle,*beforexrselect,*blur,*cancel,*canplay,*canplaythrough,*change,*click,*close,*contentvisibilityautostatechange,*contextlost,*contextmenu,*contextrestored,*copy,*cuechange,*cut,*dblclick,*drag,*dragend,*dragenter,*dragleave,*dragover,*dragstart,*drop,*durationchange,*emptied,*ended,*error,*focus,*formdata,*gotpointercapture,*input,*invalid,*keydown,*keypress,*keyup,*load,*loadeddata,*loadedmetadata,*loadstart,*lostpointercapture,*mousedown,*mouseenter,*mouseleave,*mousemove,*mouseout,*mouseover,*mouseup,*mousewheel,*paste,*pause,*play,*playing,*pointercancel,*pointerdown,*pointerenter,*pointerleave,*pointermove,*pointerout,*pointerover,*pointerrawupdate,*pointerup,*progress,*ratechange,*reset,*resize,*scroll,*scrollend,*securitypolicyviolation,*seeked,*seeking,*select,*selectionchange,*selectstart,*slotchange,*stalled,*submit,*suspend,*timeupdate,*toggle,*transitioncancel,*transitionend,*transitionrun,*transitionstart,*volumechange,*waiting,*webkitanimationend,*webkitanimationiteration,*webkitanimationstart,*webkittransitionend,*wheel,%style,#tabIndex",
  ":math:math^:math:|",
  ":math:maction^:math:|",
  ":math:menclose^:math:|",
  ":math:merror^:math:|",
  ":math:mfenced^:math:|",
  ":math:mfrac^:math:|",
  ":math:mi^:math:|",
  ":math:mmultiscripts^:math:|",
  ":math:mn^:math:|",
  ":math:mo^:math:|",
  ":math:mover^:math:|",
  ":math:mpadded^:math:|",
  ":math:mphantom^:math:|",
  ":math:mroot^:math:|",
  ":math:mrow^:math:|",
  ":math:ms^:math:|",
  ":math:mspace^:math:|",
  ":math:msqrt^:math:|",
  ":math:mstyle^:math:|",
  ":math:msub^:math:|",
  ":math:msubsup^:math:|",
  ":math:msup^:math:|",
  ":math:mtable^:math:|",
  ":math:mtd^:math:|",
  ":math:mtext^:math:|",
  ":math:mtr^:math:|",
  ":math:munder^:math:|",
  ":math:munderover^:math:|",
  ":math:semantics^:math:|"
];
var _ATTR_TO_PROP = new Map(Object.entries({
  "class": "className",
  "for": "htmlFor",
  "formaction": "formAction",
  "innerHtml": "innerHTML",
  "readonly": "readOnly",
  "tabindex": "tabIndex",
  "aria-activedescendant": "ariaActiveDescendantElement",
  "aria-atomic": "ariaAtomic",
  "aria-autocomplete": "ariaAutoComplete",
  "aria-busy": "ariaBusy",
  "aria-checked": "ariaChecked",
  "aria-colcount": "ariaColCount",
  "aria-colindex": "ariaColIndex",
  "aria-colindextext": "ariaColIndexText",
  "aria-colspan": "ariaColSpan",
  "aria-controls": "ariaControlsElements",
  "aria-current": "ariaCurrent",
  "aria-describedby": "ariaDescribedByElements",
  "aria-description": "ariaDescription",
  "aria-details": "ariaDetailsElements",
  "aria-disabled": "ariaDisabled",
  "aria-errormessage": "ariaErrorMessageElements",
  "aria-expanded": "ariaExpanded",
  "aria-flowto": "ariaFlowToElements",
  "aria-haspopup": "ariaHasPopup",
  "aria-hidden": "ariaHidden",
  "aria-invalid": "ariaInvalid",
  "aria-keyshortcuts": "ariaKeyShortcuts",
  "aria-label": "ariaLabel",
  "aria-labelledby": "ariaLabelledByElements",
  "aria-level": "ariaLevel",
  "aria-live": "ariaLive",
  "aria-modal": "ariaModal",
  "aria-multiline": "ariaMultiLine",
  "aria-multiselectable": "ariaMultiSelectable",
  "aria-orientation": "ariaOrientation",
  "aria-owns": "ariaOwnsElements",
  "aria-placeholder": "ariaPlaceholder",
  "aria-posinset": "ariaPosInSet",
  "aria-pressed": "ariaPressed",
  "aria-readonly": "ariaReadOnly",
  "aria-required": "ariaRequired",
  "aria-roledescription": "ariaRoleDescription",
  "aria-rowcount": "ariaRowCount",
  "aria-rowindex": "ariaRowIndex",
  "aria-rowindextext": "ariaRowIndexText",
  "aria-rowspan": "ariaRowSpan",
  "aria-selected": "ariaSelected",
  "aria-setsize": "ariaSetSize",
  "aria-sort": "ariaSort",
  "aria-valuemax": "ariaValueMax",
  "aria-valuemin": "ariaValueMin",
  "aria-valuenow": "ariaValueNow",
  "aria-valuetext": "ariaValueText"
}));
var _PROP_TO_ATTR = Array.from(_ATTR_TO_PROP).reduce((inverted, [propertyName, attributeName]) => {
  inverted.set(propertyName, attributeName);
  return inverted;
}, /* @__PURE__ */ new Map());
var DomElementSchemaRegistry = class extends ElementSchemaRegistry {
  _schema = /* @__PURE__ */ new Map();
  _eventSchema = /* @__PURE__ */ new Map();
  constructor() {
    super();
    SCHEMA.forEach((encodedType) => {
      const type = /* @__PURE__ */ new Map();
      const events = /* @__PURE__ */ new Set();
      const [strType, strProperties] = encodedType.split("|");
      const properties = strProperties.split(",");
      const [typeNames, superName] = strType.split("^");
      typeNames.split(",").forEach((tag) => {
        this._schema.set(tag.toLowerCase(), type);
        this._eventSchema.set(tag.toLowerCase(), events);
      });
      const superType = superName && this._schema.get(superName.toLowerCase());
      if (superType) {
        for (const [prop, value] of superType) type.set(prop, value);
        for (const superEvent of this._eventSchema.get(superName.toLowerCase())) events.add(superEvent);
      }
      properties.forEach((property) => {
        if (property.length > 0) switch (property[0]) {
          case "*":
            events.add(property.substring(1));
            break;
          case "!":
            type.set(property.substring(1), BOOLEAN);
            break;
          case "#":
            type.set(property.substring(1), NUMBER);
            break;
          case "%":
            type.set(property.substring(1), OBJECT);
            break;
          default:
            type.set(property, STRING);
        }
      });
    });
  }
  hasProperty(tagName, propName, schemaMetas) {
    if (schemaMetas.some((schema) => schema.name === NO_ERRORS_SCHEMA.name)) return true;
    const normalizedTag = normalizeTagName(tagName);
    if (normalizedTag.includes("-")) {
      if (isNgContainer(normalizedTag) || isNgContent(normalizedTag)) return false;
      if (schemaMetas.some((schema) => schema.name === CUSTOM_ELEMENTS_SCHEMA.name)) return true;
    }
    return (this._schema.get(normalizedTag) || this._schema.get("unknown")).has(propName);
  }
  hasElement(tagName, schemaMetas) {
    if (schemaMetas.some((schema) => schema.name === NO_ERRORS_SCHEMA.name)) return true;
    const normalizedTag = normalizeTagName(tagName);
    if (normalizedTag.includes("-")) {
      if (isNgContainer(normalizedTag) || isNgContent(normalizedTag)) return true;
      if (schemaMetas.some((schema) => schema.name === CUSTOM_ELEMENTS_SCHEMA.name)) return true;
    }
    return this._schema.has(normalizedTag);
  }
  /**
  * securityContext returns the security context for the given property on the given DOM tag.
  *
  * Tag and property name are statically known and cannot change at runtime, i.e. it is not
  * possible to bind a value into a changing attribute or tag name.
  *
  * The filtering is based on a list of allowed tags|attributes. All attributes in the schema
  * above are assumed to have the 'NONE' security context, i.e. that they are safe inert
  * string values. Only specific well known attack vectors are assigned their appropriate context.
  */
  securityContext(tagName, propName, isAttribute) {
    if (isAttribute) propName = this.getMappedPropName(propName);
    const [ns, name] = splitNsName(tagName, false);
    return checkSecurityContext(name, propName, ns);
  }
  getMappedPropName(propName) {
    return _ATTR_TO_PROP.get(propName) ?? propName;
  }
  getDefaultComponentElementName() {
    return "ng-component";
  }
  validateProperty(name) {
    if (name.toLowerCase().startsWith("on")) return {
      error: true,
      msg: `Binding to event property '${name}' is disallowed for security reasons, please use (${name.slice(2)})=...
If '${name}' is a directive input, make sure the directive is imported by the current module.`
    };
    else return { error: false };
  }
  validateAttribute(name) {
    if (name.toLowerCase().startsWith("on")) return {
      error: true,
      msg: `Binding to event attribute '${name}' is disallowed for security reasons, please use (${name.slice(2)})=...`
    };
    else return { error: false };
  }
  allKnownElementNames() {
    return Array.from(this._schema.keys());
  }
  allKnownAttributesOfElement(tagName) {
    const normalizedTag = normalizeTagName(tagName);
    const elementProperties = this._schema.get(normalizedTag) || this._schema.get("unknown");
    return Array.from(elementProperties.keys()).map((prop) => _PROP_TO_ATTR.get(prop) ?? prop);
  }
  allKnownEventsOfElement(tagName) {
    const normalizedTag = normalizeTagName(tagName);
    return Array.from(this._eventSchema.get(normalizedTag) ?? []);
  }
  normalizeAnimationStyleProperty(propName) {
    return dashCaseToCamelCase(propName);
  }
  normalizeAnimationStyleValue(camelCaseProp, userProvidedProp, val) {
    let unit = "";
    const strVal = val.toString().trim();
    let errorMsg = null;
    if (_isPixelDimensionStyle(camelCaseProp) && val !== 0 && val !== "0") if (typeof val === "number") unit = "px";
    else {
      const valAndSuffixMatch = val.match(/^[+-]?[\d\.]+([a-z]*)$/);
      if (valAndSuffixMatch && valAndSuffixMatch[1].length == 0) errorMsg = `Please provide a CSS unit value for ${userProvidedProp}:${val}`;
    }
    return {
      error: errorMsg,
      value: strVal + unit
    };
  }
};
function _isPixelDimensionStyle(prop) {
  switch (prop) {
    case "width":
    case "height":
    case "minWidth":
    case "minHeight":
    case "maxWidth":
    case "maxHeight":
    case "left":
    case "top":
    case "bottom":
    case "right":
    case "fontSize":
    case "outlineWidth":
    case "outlineOffset":
    case "paddingTop":
    case "paddingLeft":
    case "paddingBottom":
    case "paddingRight":
    case "marginTop":
    case "marginLeft":
    case "marginBottom":
    case "marginRight":
    case "borderRadius":
    case "borderWidth":
    case "borderTopWidth":
    case "borderLeftWidth":
    case "borderRightWidth":
    case "borderBottomWidth":
    case "textIndent":
      return true;
    default:
      return false;
  }
}

// node_modules/angular-html-parser/dist/compiler/src/ml_parser/html_tags.mjs
var HtmlTagDefinition = class {
  closedByChildren = {};
  contentType;
  closedByParent = false;
  implicitNamespacePrefix;
  isVoid;
  ignoreFirstLf;
  canSelfClose;
  preventNamespaceInheritance;
  constructor({ closedByChildren, implicitNamespacePrefix, contentType = 2, closedByParent = false, isVoid = false, ignoreFirstLf = false, preventNamespaceInheritance = false, canSelfClose = false } = {}) {
    if (closedByChildren && closedByChildren.length > 0) closedByChildren.forEach((tagName) => this.closedByChildren[tagName] = true);
    this.isVoid = isVoid;
    this.closedByParent = closedByParent || isVoid;
    this.implicitNamespacePrefix = implicitNamespacePrefix || null;
    this.contentType = contentType;
    this.ignoreFirstLf = ignoreFirstLf;
    this.preventNamespaceInheritance = preventNamespaceInheritance;
    this.canSelfClose = canSelfClose ?? isVoid;
  }
  isClosedByChild(name) {
    return this.isVoid || name.toLowerCase() in this.closedByChildren;
  }
  getContentType(prefix2) {
    if (typeof this.contentType === "object") return (prefix2 === void 0 ? void 0 : this.contentType[prefix2]) ?? this.contentType.default;
    return this.contentType;
  }
};
var DEFAULT_TAG_DEFINITION;
var TAG_DEFINITIONS;
function getHtmlTagDefinition(tagName) {
  if (!TAG_DEFINITIONS) {
    DEFAULT_TAG_DEFINITION = new HtmlTagDefinition({ canSelfClose: true });
    TAG_DEFINITIONS = Object.assign(/* @__PURE__ */ Object.create(null), {
      "base": new HtmlTagDefinition({ isVoid: true }),
      "meta": new HtmlTagDefinition({ isVoid: true }),
      "area": new HtmlTagDefinition({ isVoid: true }),
      "embed": new HtmlTagDefinition({ isVoid: true }),
      "link": new HtmlTagDefinition({ isVoid: true }),
      "img": new HtmlTagDefinition({ isVoid: true }),
      "input": new HtmlTagDefinition({ isVoid: true }),
      "param": new HtmlTagDefinition({ isVoid: true }),
      "hr": new HtmlTagDefinition({ isVoid: true }),
      "br": new HtmlTagDefinition({ isVoid: true }),
      "source": new HtmlTagDefinition({ isVoid: true }),
      "track": new HtmlTagDefinition({ isVoid: true }),
      "wbr": new HtmlTagDefinition({ isVoid: true }),
      "p": new HtmlTagDefinition({
        closedByChildren: [
          "address",
          "article",
          "aside",
          "blockquote",
          "div",
          "dl",
          "fieldset",
          "footer",
          "form",
          "h1",
          "h2",
          "h3",
          "h4",
          "h5",
          "h6",
          "header",
          "hgroup",
          "hr",
          "main",
          "nav",
          "ol",
          "p",
          "pre",
          "section",
          "table",
          "ul"
        ],
        closedByParent: true
      }),
      "thead": new HtmlTagDefinition({ closedByChildren: ["tbody", "tfoot"] }),
      "tbody": new HtmlTagDefinition({
        closedByChildren: ["tbody", "tfoot"],
        closedByParent: true
      }),
      "tfoot": new HtmlTagDefinition({
        closedByChildren: ["tbody"],
        closedByParent: true
      }),
      "tr": new HtmlTagDefinition({
        closedByChildren: ["tr"],
        closedByParent: true
      }),
      "td": new HtmlTagDefinition({
        closedByChildren: ["td", "th"],
        closedByParent: true
      }),
      "th": new HtmlTagDefinition({
        closedByChildren: ["td", "th"],
        closedByParent: true
      }),
      "col": new HtmlTagDefinition({ isVoid: true }),
      "svg": new HtmlTagDefinition({ implicitNamespacePrefix: "svg" }),
      "foreignObject": new HtmlTagDefinition({
        implicitNamespacePrefix: "svg",
        preventNamespaceInheritance: true
      }),
      "math": new HtmlTagDefinition({ implicitNamespacePrefix: "math" }),
      "li": new HtmlTagDefinition({
        closedByChildren: ["li"],
        closedByParent: true
      }),
      "dt": new HtmlTagDefinition({ closedByChildren: ["dt", "dd"] }),
      "dd": new HtmlTagDefinition({
        closedByChildren: ["dt", "dd"],
        closedByParent: true
      }),
      "rb": new HtmlTagDefinition({
        closedByChildren: [
          "rb",
          "rt",
          "rtc",
          "rp"
        ],
        closedByParent: true
      }),
      "rt": new HtmlTagDefinition({
        closedByChildren: [
          "rb",
          "rt",
          "rtc",
          "rp"
        ],
        closedByParent: true
      }),
      "rtc": new HtmlTagDefinition({
        closedByChildren: [
          "rb",
          "rtc",
          "rp"
        ],
        closedByParent: true
      }),
      "rp": new HtmlTagDefinition({
        closedByChildren: [
          "rb",
          "rt",
          "rtc",
          "rp"
        ],
        closedByParent: true
      }),
      "optgroup": new HtmlTagDefinition({
        closedByChildren: ["optgroup"],
        closedByParent: true
      }),
      "option": new HtmlTagDefinition({
        closedByChildren: ["option", "optgroup"],
        closedByParent: true
      }),
      "pre": new HtmlTagDefinition({ ignoreFirstLf: true }),
      "listing": new HtmlTagDefinition({ ignoreFirstLf: true }),
      "style": new HtmlTagDefinition({ contentType: 0 }),
      "script": new HtmlTagDefinition({ contentType: 0 }),
      "title": new HtmlTagDefinition({ contentType: {
        default: 1,
        svg: 2
      } }),
      "textarea": new HtmlTagDefinition({
        contentType: 1,
        ignoreFirstLf: true
      })
    });
    new DomElementSchemaRegistry().allKnownElementNames().forEach((knownTagName) => {
      if (!TAG_DEFINITIONS[knownTagName] && getNsPrefix(knownTagName) === null) TAG_DEFINITIONS[knownTagName] = new HtmlTagDefinition({ canSelfClose: false });
    });
  }
  return TAG_DEFINITIONS[tagName] ?? DEFAULT_TAG_DEFINITION;
}

// node_modules/angular-html-parser/dist/compiler/src/parse_util.mjs
var ParseLocation = class ParseLocation2 {
  file;
  offset;
  line;
  col;
  constructor(file, offset, line, col) {
    this.file = file;
    this.offset = offset;
    this.line = line;
    this.col = col;
  }
  toString() {
    return this.offset != null ? `${this.file.url}@${this.line}:${this.col}` : this.file.url;
  }
  moveBy(delta) {
    const source = this.file.content;
    const len = source.length;
    let offset = this.offset;
    let line = this.line;
    let col = this.col;
    while (offset > 0 && delta < 0) {
      offset--;
      delta++;
      if (source.charCodeAt(offset) == 10) {
        line--;
        const priorLine = source.substring(0, offset - 1).lastIndexOf(String.fromCharCode(10));
        col = priorLine > 0 ? offset - priorLine : offset;
      } else col--;
    }
    while (offset < len && delta > 0) {
      const ch = source.charCodeAt(offset);
      offset++;
      delta--;
      if (ch == 10) {
        line++;
        col = 0;
      } else col++;
    }
    return new ParseLocation2(this.file, offset, line, col);
  }
  getContext(maxChars, maxLines) {
    const content = this.file.content;
    let startOffset = this.offset;
    if (startOffset != null) {
      if (startOffset > content.length - 1) startOffset = content.length - 1;
      let endOffset = startOffset;
      let ctxChars = 0;
      let ctxLines = 0;
      while (ctxChars < maxChars && startOffset > 0) {
        startOffset--;
        ctxChars++;
        if (content[startOffset] == "\n") {
          if (++ctxLines == maxLines) break;
        }
      }
      ctxChars = 0;
      ctxLines = 0;
      while (ctxChars < maxChars && endOffset < content.length - 1) {
        endOffset++;
        ctxChars++;
        if (content[endOffset] == "\n") {
          if (++ctxLines == maxLines) break;
        }
      }
      return {
        before: content.substring(startOffset, this.offset),
        after: content.substring(this.offset, endOffset + 1)
      };
    }
    return null;
  }
};
var ParseSourceFile = class {
  content;
  url;
  constructor(content, url) {
    this.content = content;
    this.url = url;
  }
};
var ParseSourceSpan = class {
  start;
  end;
  fullStart;
  details;
  /**
  * Create an object that holds information about spans of tokens/nodes captured during
  * lexing/parsing of text.
  *
  * @param start
  * The location of the start of the span (having skipped leading trivia).
  * Skipping leading trivia makes source-spans more "user friendly", since things like HTML
  * elements will appear to begin at the start of the opening tag, rather than at the start of any
  * leading trivia, which could include newlines.
  *
  * @param end
  * The location of the end of the span.
  *
  * @param fullStart
  * The start of the token without skipping the leading trivia.
  * This is used by tooling that splits tokens further, such as extracting Angular interpolations
  * from text tokens. Such tooling creates new source-spans relative to the original token's
  * source-span. If leading trivia characters have been skipped then the new source-spans may be
  * incorrectly offset.
  *
  * @param details
  * Additional information (such as identifier names) that should be associated with the span.
  */
  constructor(start, end, fullStart = start, details = null) {
    this.start = start;
    this.end = end;
    this.fullStart = fullStart;
    this.details = details;
  }
  toString() {
    return this.start.file.content.substring(this.start.offset, this.end.offset);
  }
};
var ParseErrorLevel = /* @__PURE__ */ function(ParseErrorLevel2) {
  ParseErrorLevel2[ParseErrorLevel2["WARNING"] = 0] = "WARNING";
  ParseErrorLevel2[ParseErrorLevel2["ERROR"] = 1] = "ERROR";
  return ParseErrorLevel2;
}({});
var ParseError = class extends Error {
  span;
  msg;
  level;
  relatedError;
  constructor(span, msg, level = 1, relatedError) {
    super(msg);
    this.span = span;
    this.msg = msg;
    this.level = level;
    this.relatedError = relatedError;
    Object.setPrototypeOf(this, new.target.prototype);
  }
  contextualMessage() {
    const ctx = this.span.start.getContext(100, 3);
    return ctx ? `${this.msg} ("${ctx.before}[${ParseErrorLevel[this.level]} ->]${ctx.after}")` : this.msg;
  }
  toString() {
    const details = this.span.details ? `, ${this.span.details}` : "";
    return `${this.contextualMessage()}: ${this.span.start}${details}`;
  }
};

// node_modules/angular-html-parser/dist/compiler/src/ml_parser/ast.mjs
var NodeWithI18n = class {
  sourceSpan;
  i18n;
  constructor(sourceSpan, i18n) {
    this.sourceSpan = sourceSpan;
    this.i18n = i18n;
  }
};
var Text = class extends NodeWithI18n {
  value;
  tokens;
  constructor(value, sourceSpan, tokens2, i18n) {
    super(sourceSpan, i18n);
    this.value = value;
    this.tokens = tokens2;
  }
  visit(visitor, context) {
    return visitor.visitText(this, context);
  }
  kind = "text";
};
var CDATA = class extends NodeWithI18n {
  value;
  tokens;
  constructor(value, sourceSpan, tokens2, i18n) {
    super(sourceSpan, i18n);
    this.value = value;
    this.tokens = tokens2;
  }
  visit(visitor, context) {
    return visitor.visitCdata(this, context);
  }
  kind = "cdata";
};
var Expansion = class extends NodeWithI18n {
  switchValue;
  type;
  cases;
  switchValueSourceSpan;
  constructor(switchValue, type, cases, sourceSpan, switchValueSourceSpan, i18n) {
    super(sourceSpan, i18n);
    this.switchValue = switchValue;
    this.type = type;
    this.cases = cases;
    this.switchValueSourceSpan = switchValueSourceSpan;
  }
  visit(visitor, context) {
    return visitor.visitExpansion(this, context);
  }
  kind = "expansion";
};
var ExpansionCase = class {
  value;
  expression;
  sourceSpan;
  valueSourceSpan;
  expSourceSpan;
  constructor(value, expression, sourceSpan, valueSourceSpan, expSourceSpan) {
    this.value = value;
    this.expression = expression;
    this.sourceSpan = sourceSpan;
    this.valueSourceSpan = valueSourceSpan;
    this.expSourceSpan = expSourceSpan;
  }
  visit(visitor, context) {
    return visitor.visitExpansionCase(this, context);
  }
  kind = "expansionCase";
};
var Attribute = class extends NodeWithI18n {
  name;
  value;
  keySpan;
  valueSpan;
  valueTokens;
  constructor(name, value, sourceSpan, keySpan, valueSpan, valueTokens, i18n) {
    super(sourceSpan, i18n);
    this.name = name;
    this.value = value;
    this.keySpan = keySpan;
    this.valueSpan = valueSpan;
    this.valueTokens = valueTokens;
  }
  visit(visitor, context) {
    return visitor.visitAttribute(this, context);
  }
  kind = "attribute";
  get nameSpan() {
    return this.keySpan;
  }
};
var StartTagComment = class {
  value;
  type;
  sourceSpan;
  constructor(value, type, sourceSpan) {
    this.value = value;
    this.type = type;
    this.sourceSpan = sourceSpan;
  }
  visit(visitor, context) {
    return visitor.visitStartTagComment ? visitor.visitStartTagComment(this, context) : void 0;
  }
  kind = "startTagComment";
};
var Element = class extends NodeWithI18n {
  name;
  attrs;
  directives;
  children;
  isSelfClosing;
  startSourceSpan;
  endSourceSpan;
  nameSpan;
  isVoid;
  comments;
  constructor(name, attrs, directives, children, isSelfClosing, sourceSpan, startSourceSpan, endSourceSpan = null, nameSpan = null, isVoid, i18n, comments = []) {
    super(sourceSpan, i18n);
    this.name = name;
    this.attrs = attrs;
    this.directives = directives;
    this.children = children;
    this.isSelfClosing = isSelfClosing;
    this.startSourceSpan = startSourceSpan;
    this.endSourceSpan = endSourceSpan;
    this.nameSpan = nameSpan;
    this.isVoid = isVoid;
    this.comments = comments;
  }
  visit(visitor, context) {
    return visitor.visitElement(this, context);
  }
  kind = "element";
};
var Comment = class {
  value;
  sourceSpan;
  constructor(value, sourceSpan) {
    this.value = value;
    this.sourceSpan = sourceSpan;
  }
  visit(visitor, context) {
    return visitor.visitComment(this, context);
  }
  kind = "comment";
};
var DocType = class {
  value;
  sourceSpan;
  constructor(value, sourceSpan) {
    this.value = value;
    this.sourceSpan = sourceSpan;
  }
  visit(visitor, context) {
    return visitor.visitDocType(this, context);
  }
  kind = "docType";
};
var Block = class extends NodeWithI18n {
  name;
  parameters;
  children;
  nameSpan;
  startSourceSpan;
  endSourceSpan;
  constructor(name, parameters, children, sourceSpan, nameSpan, startSourceSpan, endSourceSpan = null, i18n) {
    super(sourceSpan, i18n);
    this.name = name;
    this.parameters = parameters;
    this.children = children;
    this.nameSpan = nameSpan;
    this.startSourceSpan = startSourceSpan;
    this.endSourceSpan = endSourceSpan;
  }
  visit(visitor, context) {
    return visitor.visitBlock(this, context);
  }
  kind = "block";
};
var Component = class extends NodeWithI18n {
  componentName;
  tagName;
  fullName;
  attrs;
  directives;
  children;
  isSelfClosing;
  startSourceSpan;
  endSourceSpan;
  comments;
  constructor(componentName2, tagName, fullName, attrs, directives, children, isSelfClosing, sourceSpan, startSourceSpan, endSourceSpan = null, i18n, comments = []) {
    super(sourceSpan, i18n);
    this.componentName = componentName2;
    this.tagName = tagName;
    this.fullName = fullName;
    this.attrs = attrs;
    this.directives = directives;
    this.children = children;
    this.isSelfClosing = isSelfClosing;
    this.startSourceSpan = startSourceSpan;
    this.endSourceSpan = endSourceSpan;
    this.comments = comments;
  }
  visit(visitor, context) {
    return visitor.visitComponent(this, context);
  }
  kind = "component";
};
var Directive = class {
  name;
  attrs;
  sourceSpan;
  startSourceSpan;
  endSourceSpan;
  constructor(name, attrs, sourceSpan, startSourceSpan, endSourceSpan = null) {
    this.name = name;
    this.attrs = attrs;
    this.sourceSpan = sourceSpan;
    this.startSourceSpan = startSourceSpan;
    this.endSourceSpan = endSourceSpan;
  }
  visit(visitor, context) {
    return visitor.visitDirective(this, context);
  }
  kind = "directive";
};
var BlockParameter = class {
  expression;
  sourceSpan;
  constructor(expression, sourceSpan) {
    this.expression = expression;
    this.sourceSpan = sourceSpan;
  }
  visit(visitor, context) {
    return visitor.visitBlockParameter(this, context);
  }
  kind = "blockParameter";
  startSourceSpan = null;
  endSourceSpan = null;
};
var LetDeclaration = class {
  name;
  value;
  sourceSpan;
  nameSpan;
  valueSpan;
  constructor(name, value, sourceSpan, nameSpan, valueSpan) {
    this.name = name;
    this.value = value;
    this.sourceSpan = sourceSpan;
    this.nameSpan = nameSpan;
    this.valueSpan = valueSpan;
  }
  visit(visitor, context) {
    return visitor.visitLetDeclaration(this, context);
  }
  kind = "letDeclaration";
  startSourceSpan = null;
  endSourceSpan = null;
};

// node_modules/angular-html-parser/dist/compiler/src/chars.mjs
function isWhitespace2(code2) {
  return code2 >= 9 && code2 <= 32 || code2 == 160;
}
function isDigit2(code2) {
  return 48 <= code2 && code2 <= 57;
}
function isAsciiLetter(code2) {
  return code2 >= 97 && code2 <= 122 || code2 >= 65 && code2 <= 90;
}
function isAsciiHexDigit(code2) {
  return code2 >= 97 && code2 <= 102 || code2 >= 65 && code2 <= 70 || isDigit2(code2);
}
function isNewLine2(code2) {
  return code2 === 10 || code2 === 13;
}
function isOctalDigit(code2) {
  return 48 <= code2 && code2 <= 55;
}
function isQuote(code2) {
  return code2 === 39 || code2 === 34 || code2 === 96;
}

// node_modules/angular-html-parser/dist/compiler/src/ml_parser/entities.mjs
var NAMED_ENTITIES = {
  "AElig": "\xC6",
  "AMP": "&",
  "amp": "&",
  "Aacute": "\xC1",
  "Abreve": "\u0102",
  "Acirc": "\xC2",
  "Acy": "\u0410",
  "Afr": "\u{1D504}",
  "Agrave": "\xC0",
  "Alpha": "\u0391",
  "Amacr": "\u0100",
  "And": "\u2A53",
  "Aogon": "\u0104",
  "Aopf": "\u{1D538}",
  "ApplyFunction": "\u2061",
  "af": "\u2061",
  "Aring": "\xC5",
  "angst": "\xC5",
  "Ascr": "\u{1D49C}",
  "Assign": "\u2254",
  "colone": "\u2254",
  "coloneq": "\u2254",
  "Atilde": "\xC3",
  "Auml": "\xC4",
  "Backslash": "\u2216",
  "setminus": "\u2216",
  "setmn": "\u2216",
  "smallsetminus": "\u2216",
  "ssetmn": "\u2216",
  "Barv": "\u2AE7",
  "Barwed": "\u2306",
  "doublebarwedge": "\u2306",
  "Bcy": "\u0411",
  "Because": "\u2235",
  "becaus": "\u2235",
  "because": "\u2235",
  "Bernoullis": "\u212C",
  "Bscr": "\u212C",
  "bernou": "\u212C",
  "Beta": "\u0392",
  "Bfr": "\u{1D505}",
  "Bopf": "\u{1D539}",
  "Breve": "\u02D8",
  "breve": "\u02D8",
  "Bumpeq": "\u224E",
  "HumpDownHump": "\u224E",
  "bump": "\u224E",
  "CHcy": "\u0427",
  "COPY": "\xA9",
  "copy": "\xA9",
  "Cacute": "\u0106",
  "Cap": "\u22D2",
  "CapitalDifferentialD": "\u2145",
  "DD": "\u2145",
  "Cayleys": "\u212D",
  "Cfr": "\u212D",
  "Ccaron": "\u010C",
  "Ccedil": "\xC7",
  "Ccirc": "\u0108",
  "Cconint": "\u2230",
  "Cdot": "\u010A",
  "Cedilla": "\xB8",
  "cedil": "\xB8",
  "CenterDot": "\xB7",
  "centerdot": "\xB7",
  "middot": "\xB7",
  "Chi": "\u03A7",
  "CircleDot": "\u2299",
  "odot": "\u2299",
  "CircleMinus": "\u2296",
  "ominus": "\u2296",
  "CirclePlus": "\u2295",
  "oplus": "\u2295",
  "CircleTimes": "\u2297",
  "otimes": "\u2297",
  "ClockwiseContourIntegral": "\u2232",
  "cwconint": "\u2232",
  "CloseCurlyDoubleQuote": "\u201D",
  "rdquo": "\u201D",
  "rdquor": "\u201D",
  "CloseCurlyQuote": "\u2019",
  "rsquo": "\u2019",
  "rsquor": "\u2019",
  "Colon": "\u2237",
  "Proportion": "\u2237",
  "Colone": "\u2A74",
  "Congruent": "\u2261",
  "equiv": "\u2261",
  "Conint": "\u222F",
  "DoubleContourIntegral": "\u222F",
  "ContourIntegral": "\u222E",
  "conint": "\u222E",
  "oint": "\u222E",
  "Copf": "\u2102",
  "complexes": "\u2102",
  "Coproduct": "\u2210",
  "coprod": "\u2210",
  "CounterClockwiseContourIntegral": "\u2233",
  "awconint": "\u2233",
  "Cross": "\u2A2F",
  "Cscr": "\u{1D49E}",
  "Cup": "\u22D3",
  "CupCap": "\u224D",
  "asympeq": "\u224D",
  "DDotrahd": "\u2911",
  "DJcy": "\u0402",
  "DScy": "\u0405",
  "DZcy": "\u040F",
  "Dagger": "\u2021",
  "ddagger": "\u2021",
  "Darr": "\u21A1",
  "Dashv": "\u2AE4",
  "DoubleLeftTee": "\u2AE4",
  "Dcaron": "\u010E",
  "Dcy": "\u0414",
  "Del": "\u2207",
  "nabla": "\u2207",
  "Delta": "\u0394",
  "Dfr": "\u{1D507}",
  "DiacriticalAcute": "\xB4",
  "acute": "\xB4",
  "DiacriticalDot": "\u02D9",
  "dot": "\u02D9",
  "DiacriticalDoubleAcute": "\u02DD",
  "dblac": "\u02DD",
  "DiacriticalGrave": "`",
  "grave": "`",
  "DiacriticalTilde": "\u02DC",
  "tilde": "\u02DC",
  "Diamond": "\u22C4",
  "diam": "\u22C4",
  "diamond": "\u22C4",
  "DifferentialD": "\u2146",
  "dd": "\u2146",
  "Dopf": "\u{1D53B}",
  "Dot": "\xA8",
  "DoubleDot": "\xA8",
  "die": "\xA8",
  "uml": "\xA8",
  "DotDot": "\u20DC",
  "DotEqual": "\u2250",
  "doteq": "\u2250",
  "esdot": "\u2250",
  "DoubleDownArrow": "\u21D3",
  "Downarrow": "\u21D3",
  "dArr": "\u21D3",
  "DoubleLeftArrow": "\u21D0",
  "Leftarrow": "\u21D0",
  "lArr": "\u21D0",
  "DoubleLeftRightArrow": "\u21D4",
  "Leftrightarrow": "\u21D4",
  "hArr": "\u21D4",
  "iff": "\u21D4",
  "DoubleLongLeftArrow": "\u27F8",
  "Longleftarrow": "\u27F8",
  "xlArr": "\u27F8",
  "DoubleLongLeftRightArrow": "\u27FA",
  "Longleftrightarrow": "\u27FA",
  "xhArr": "\u27FA",
  "DoubleLongRightArrow": "\u27F9",
  "Longrightarrow": "\u27F9",
  "xrArr": "\u27F9",
  "DoubleRightArrow": "\u21D2",
  "Implies": "\u21D2",
  "Rightarrow": "\u21D2",
  "rArr": "\u21D2",
  "DoubleRightTee": "\u22A8",
  "vDash": "\u22A8",
  "DoubleUpArrow": "\u21D1",
  "Uparrow": "\u21D1",
  "uArr": "\u21D1",
  "DoubleUpDownArrow": "\u21D5",
  "Updownarrow": "\u21D5",
  "vArr": "\u21D5",
  "DoubleVerticalBar": "\u2225",
  "par": "\u2225",
  "parallel": "\u2225",
  "shortparallel": "\u2225",
  "spar": "\u2225",
  "DownArrow": "\u2193",
  "ShortDownArrow": "\u2193",
  "darr": "\u2193",
  "downarrow": "\u2193",
  "DownArrowBar": "\u2913",
  "DownArrowUpArrow": "\u21F5",
  "duarr": "\u21F5",
  "DownBreve": "\u0311",
  "DownLeftRightVector": "\u2950",
  "DownLeftTeeVector": "\u295E",
  "DownLeftVector": "\u21BD",
  "leftharpoondown": "\u21BD",
  "lhard": "\u21BD",
  "DownLeftVectorBar": "\u2956",
  "DownRightTeeVector": "\u295F",
  "DownRightVector": "\u21C1",
  "rhard": "\u21C1",
  "rightharpoondown": "\u21C1",
  "DownRightVectorBar": "\u2957",
  "DownTee": "\u22A4",
  "top": "\u22A4",
  "DownTeeArrow": "\u21A7",
  "mapstodown": "\u21A7",
  "Dscr": "\u{1D49F}",
  "Dstrok": "\u0110",
  "ENG": "\u014A",
  "ETH": "\xD0",
  "Eacute": "\xC9",
  "Ecaron": "\u011A",
  "Ecirc": "\xCA",
  "Ecy": "\u042D",
  "Edot": "\u0116",
  "Efr": "\u{1D508}",
  "Egrave": "\xC8",
  "Element": "\u2208",
  "in": "\u2208",
  "isin": "\u2208",
  "isinv": "\u2208",
  "Emacr": "\u0112",
  "EmptySmallSquare": "\u25FB",
  "EmptyVerySmallSquare": "\u25AB",
  "Eogon": "\u0118",
  "Eopf": "\u{1D53C}",
  "Epsilon": "\u0395",
  "Equal": "\u2A75",
  "EqualTilde": "\u2242",
  "eqsim": "\u2242",
  "esim": "\u2242",
  "Equilibrium": "\u21CC",
  "rightleftharpoons": "\u21CC",
  "rlhar": "\u21CC",
  "Escr": "\u2130",
  "expectation": "\u2130",
  "Esim": "\u2A73",
  "Eta": "\u0397",
  "Euml": "\xCB",
  "Exists": "\u2203",
  "exist": "\u2203",
  "ExponentialE": "\u2147",
  "ee": "\u2147",
  "exponentiale": "\u2147",
  "Fcy": "\u0424",
  "Ffr": "\u{1D509}",
  "FilledSmallSquare": "\u25FC",
  "FilledVerySmallSquare": "\u25AA",
  "blacksquare": "\u25AA",
  "squarf": "\u25AA",
  "squf": "\u25AA",
  "Fopf": "\u{1D53D}",
  "ForAll": "\u2200",
  "forall": "\u2200",
  "Fouriertrf": "\u2131",
  "Fscr": "\u2131",
  "GJcy": "\u0403",
  "GT": ">",
  "gt": ">",
  "Gamma": "\u0393",
  "Gammad": "\u03DC",
  "Gbreve": "\u011E",
  "Gcedil": "\u0122",
  "Gcirc": "\u011C",
  "Gcy": "\u0413",
  "Gdot": "\u0120",
  "Gfr": "\u{1D50A}",
  "Gg": "\u22D9",
  "ggg": "\u22D9",
  "Gopf": "\u{1D53E}",
  "GreaterEqual": "\u2265",
  "ge": "\u2265",
  "geq": "\u2265",
  "GreaterEqualLess": "\u22DB",
  "gel": "\u22DB",
  "gtreqless": "\u22DB",
  "GreaterFullEqual": "\u2267",
  "gE": "\u2267",
  "geqq": "\u2267",
  "GreaterGreater": "\u2AA2",
  "GreaterLess": "\u2277",
  "gl": "\u2277",
  "gtrless": "\u2277",
  "GreaterSlantEqual": "\u2A7E",
  "geqslant": "\u2A7E",
  "ges": "\u2A7E",
  "GreaterTilde": "\u2273",
  "gsim": "\u2273",
  "gtrsim": "\u2273",
  "Gscr": "\u{1D4A2}",
  "Gt": "\u226B",
  "NestedGreaterGreater": "\u226B",
  "gg": "\u226B",
  "HARDcy": "\u042A",
  "Hacek": "\u02C7",
  "caron": "\u02C7",
  "Hat": "^",
  "Hcirc": "\u0124",
  "Hfr": "\u210C",
  "Poincareplane": "\u210C",
  "HilbertSpace": "\u210B",
  "Hscr": "\u210B",
  "hamilt": "\u210B",
  "Hopf": "\u210D",
  "quaternions": "\u210D",
  "HorizontalLine": "\u2500",
  "boxh": "\u2500",
  "Hstrok": "\u0126",
  "HumpEqual": "\u224F",
  "bumpe": "\u224F",
  "bumpeq": "\u224F",
  "IEcy": "\u0415",
  "IJlig": "\u0132",
  "IOcy": "\u0401",
  "Iacute": "\xCD",
  "Icirc": "\xCE",
  "Icy": "\u0418",
  "Idot": "\u0130",
  "Ifr": "\u2111",
  "Im": "\u2111",
  "image": "\u2111",
  "imagpart": "\u2111",
  "Igrave": "\xCC",
  "Imacr": "\u012A",
  "ImaginaryI": "\u2148",
  "ii": "\u2148",
  "Int": "\u222C",
  "Integral": "\u222B",
  "int": "\u222B",
  "Intersection": "\u22C2",
  "bigcap": "\u22C2",
  "xcap": "\u22C2",
  "InvisibleComma": "\u2063",
  "ic": "\u2063",
  "InvisibleTimes": "\u2062",
  "it": "\u2062",
  "Iogon": "\u012E",
  "Iopf": "\u{1D540}",
  "Iota": "\u0399",
  "Iscr": "\u2110",
  "imagline": "\u2110",
  "Itilde": "\u0128",
  "Iukcy": "\u0406",
  "Iuml": "\xCF",
  "Jcirc": "\u0134",
  "Jcy": "\u0419",
  "Jfr": "\u{1D50D}",
  "Jopf": "\u{1D541}",
  "Jscr": "\u{1D4A5}",
  "Jsercy": "\u0408",
  "Jukcy": "\u0404",
  "KHcy": "\u0425",
  "KJcy": "\u040C",
  "Kappa": "\u039A",
  "Kcedil": "\u0136",
  "Kcy": "\u041A",
  "Kfr": "\u{1D50E}",
  "Kopf": "\u{1D542}",
  "Kscr": "\u{1D4A6}",
  "LJcy": "\u0409",
  "LT": "<",
  "lt": "<",
  "Lacute": "\u0139",
  "Lambda": "\u039B",
  "Lang": "\u27EA",
  "Laplacetrf": "\u2112",
  "Lscr": "\u2112",
  "lagran": "\u2112",
  "Larr": "\u219E",
  "twoheadleftarrow": "\u219E",
  "Lcaron": "\u013D",
  "Lcedil": "\u013B",
  "Lcy": "\u041B",
  "LeftAngleBracket": "\u27E8",
  "lang": "\u27E8",
  "langle": "\u27E8",
  "LeftArrow": "\u2190",
  "ShortLeftArrow": "\u2190",
  "larr": "\u2190",
  "leftarrow": "\u2190",
  "slarr": "\u2190",
  "LeftArrowBar": "\u21E4",
  "larrb": "\u21E4",
  "LeftArrowRightArrow": "\u21C6",
  "leftrightarrows": "\u21C6",
  "lrarr": "\u21C6",
  "LeftCeiling": "\u2308",
  "lceil": "\u2308",
  "LeftDoubleBracket": "\u27E6",
  "lobrk": "\u27E6",
  "LeftDownTeeVector": "\u2961",
  "LeftDownVector": "\u21C3",
  "dharl": "\u21C3",
  "downharpoonleft": "\u21C3",
  "LeftDownVectorBar": "\u2959",
  "LeftFloor": "\u230A",
  "lfloor": "\u230A",
  "LeftRightArrow": "\u2194",
  "harr": "\u2194",
  "leftrightarrow": "\u2194",
  "LeftRightVector": "\u294E",
  "LeftTee": "\u22A3",
  "dashv": "\u22A3",
  "LeftTeeArrow": "\u21A4",
  "mapstoleft": "\u21A4",
  "LeftTeeVector": "\u295A",
  "LeftTriangle": "\u22B2",
  "vartriangleleft": "\u22B2",
  "vltri": "\u22B2",
  "LeftTriangleBar": "\u29CF",
  "LeftTriangleEqual": "\u22B4",
  "ltrie": "\u22B4",
  "trianglelefteq": "\u22B4",
  "LeftUpDownVector": "\u2951",
  "LeftUpTeeVector": "\u2960",
  "LeftUpVector": "\u21BF",
  "uharl": "\u21BF",
  "upharpoonleft": "\u21BF",
  "LeftUpVectorBar": "\u2958",
  "LeftVector": "\u21BC",
  "leftharpoonup": "\u21BC",
  "lharu": "\u21BC",
  "LeftVectorBar": "\u2952",
  "LessEqualGreater": "\u22DA",
  "leg": "\u22DA",
  "lesseqgtr": "\u22DA",
  "LessFullEqual": "\u2266",
  "lE": "\u2266",
  "leqq": "\u2266",
  "LessGreater": "\u2276",
  "lessgtr": "\u2276",
  "lg": "\u2276",
  "LessLess": "\u2AA1",
  "LessSlantEqual": "\u2A7D",
  "leqslant": "\u2A7D",
  "les": "\u2A7D",
  "LessTilde": "\u2272",
  "lesssim": "\u2272",
  "lsim": "\u2272",
  "Lfr": "\u{1D50F}",
  "Ll": "\u22D8",
  "Lleftarrow": "\u21DA",
  "lAarr": "\u21DA",
  "Lmidot": "\u013F",
  "LongLeftArrow": "\u27F5",
  "longleftarrow": "\u27F5",
  "xlarr": "\u27F5",
  "LongLeftRightArrow": "\u27F7",
  "longleftrightarrow": "\u27F7",
  "xharr": "\u27F7",
  "LongRightArrow": "\u27F6",
  "longrightarrow": "\u27F6",
  "xrarr": "\u27F6",
  "Lopf": "\u{1D543}",
  "LowerLeftArrow": "\u2199",
  "swarr": "\u2199",
  "swarrow": "\u2199",
  "LowerRightArrow": "\u2198",
  "searr": "\u2198",
  "searrow": "\u2198",
  "Lsh": "\u21B0",
  "lsh": "\u21B0",
  "Lstrok": "\u0141",
  "Lt": "\u226A",
  "NestedLessLess": "\u226A",
  "ll": "\u226A",
  "Map": "\u2905",
  "Mcy": "\u041C",
  "MediumSpace": "\u205F",
  "Mellintrf": "\u2133",
  "Mscr": "\u2133",
  "phmmat": "\u2133",
  "Mfr": "\u{1D510}",
  "MinusPlus": "\u2213",
  "mnplus": "\u2213",
  "mp": "\u2213",
  "Mopf": "\u{1D544}",
  "Mu": "\u039C",
  "NJcy": "\u040A",
  "Nacute": "\u0143",
  "Ncaron": "\u0147",
  "Ncedil": "\u0145",
  "Ncy": "\u041D",
  "NegativeMediumSpace": "\u200B",
  "NegativeThickSpace": "\u200B",
  "NegativeThinSpace": "\u200B",
  "NegativeVeryThinSpace": "\u200B",
  "ZeroWidthSpace": "\u200B",
  "NewLine": "\n",
  "Nfr": "\u{1D511}",
  "NoBreak": "\u2060",
  "NonBreakingSpace": "\xA0",
  "nbsp": "\xA0",
  "Nopf": "\u2115",
  "naturals": "\u2115",
  "Not": "\u2AEC",
  "NotCongruent": "\u2262",
  "nequiv": "\u2262",
  "NotCupCap": "\u226D",
  "NotDoubleVerticalBar": "\u2226",
  "npar": "\u2226",
  "nparallel": "\u2226",
  "nshortparallel": "\u2226",
  "nspar": "\u2226",
  "NotElement": "\u2209",
  "notin": "\u2209",
  "notinva": "\u2209",
  "NotEqual": "\u2260",
  "ne": "\u2260",
  "NotEqualTilde": "\u2242\u0338",
  "nesim": "\u2242\u0338",
  "NotExists": "\u2204",
  "nexist": "\u2204",
  "nexists": "\u2204",
  "NotGreater": "\u226F",
  "ngt": "\u226F",
  "ngtr": "\u226F",
  "NotGreaterEqual": "\u2271",
  "nge": "\u2271",
  "ngeq": "\u2271",
  "NotGreaterFullEqual": "\u2267\u0338",
  "ngE": "\u2267\u0338",
  "ngeqq": "\u2267\u0338",
  "NotGreaterGreater": "\u226B\u0338",
  "nGtv": "\u226B\u0338",
  "NotGreaterLess": "\u2279",
  "ntgl": "\u2279",
  "NotGreaterSlantEqual": "\u2A7E\u0338",
  "ngeqslant": "\u2A7E\u0338",
  "nges": "\u2A7E\u0338",
  "NotGreaterTilde": "\u2275",
  "ngsim": "\u2275",
  "NotHumpDownHump": "\u224E\u0338",
  "nbump": "\u224E\u0338",
  "NotHumpEqual": "\u224F\u0338",
  "nbumpe": "\u224F\u0338",
  "NotLeftTriangle": "\u22EA",
  "nltri": "\u22EA",
  "ntriangleleft": "\u22EA",
  "NotLeftTriangleBar": "\u29CF\u0338",
  "NotLeftTriangleEqual": "\u22EC",
  "nltrie": "\u22EC",
  "ntrianglelefteq": "\u22EC",
  "NotLess": "\u226E",
  "nless": "\u226E",
  "nlt": "\u226E",
  "NotLessEqual": "\u2270",
  "nle": "\u2270",
  "nleq": "\u2270",
  "NotLessGreater": "\u2278",
  "ntlg": "\u2278",
  "NotLessLess": "\u226A\u0338",
  "nLtv": "\u226A\u0338",
  "NotLessSlantEqual": "\u2A7D\u0338",
  "nleqslant": "\u2A7D\u0338",
  "nles": "\u2A7D\u0338",
  "NotLessTilde": "\u2274",
  "nlsim": "\u2274",
  "NotNestedGreaterGreater": "\u2AA2\u0338",
  "NotNestedLessLess": "\u2AA1\u0338",
  "NotPrecedes": "\u2280",
  "npr": "\u2280",
  "nprec": "\u2280",
  "NotPrecedesEqual": "\u2AAF\u0338",
  "npre": "\u2AAF\u0338",
  "npreceq": "\u2AAF\u0338",
  "NotPrecedesSlantEqual": "\u22E0",
  "nprcue": "\u22E0",
  "NotReverseElement": "\u220C",
  "notni": "\u220C",
  "notniva": "\u220C",
  "NotRightTriangle": "\u22EB",
  "nrtri": "\u22EB",
  "ntriangleright": "\u22EB",
  "NotRightTriangleBar": "\u29D0\u0338",
  "NotRightTriangleEqual": "\u22ED",
  "nrtrie": "\u22ED",
  "ntrianglerighteq": "\u22ED",
  "NotSquareSubset": "\u228F\u0338",
  "NotSquareSubsetEqual": "\u22E2",
  "nsqsube": "\u22E2",
  "NotSquareSuperset": "\u2290\u0338",
  "NotSquareSupersetEqual": "\u22E3",
  "nsqsupe": "\u22E3",
  "NotSubset": "\u2282\u20D2",
  "nsubset": "\u2282\u20D2",
  "vnsub": "\u2282\u20D2",
  "NotSubsetEqual": "\u2288",
  "nsube": "\u2288",
  "nsubseteq": "\u2288",
  "NotSucceeds": "\u2281",
  "nsc": "\u2281",
  "nsucc": "\u2281",
  "NotSucceedsEqual": "\u2AB0\u0338",
  "nsce": "\u2AB0\u0338",
  "nsucceq": "\u2AB0\u0338",
  "NotSucceedsSlantEqual": "\u22E1",
  "nsccue": "\u22E1",
  "NotSucceedsTilde": "\u227F\u0338",
  "NotSuperset": "\u2283\u20D2",
  "nsupset": "\u2283\u20D2",
  "vnsup": "\u2283\u20D2",
  "NotSupersetEqual": "\u2289",
  "nsupe": "\u2289",
  "nsupseteq": "\u2289",
  "NotTilde": "\u2241",
  "nsim": "\u2241",
  "NotTildeEqual": "\u2244",
  "nsime": "\u2244",
  "nsimeq": "\u2244",
  "NotTildeFullEqual": "\u2247",
  "ncong": "\u2247",
  "NotTildeTilde": "\u2249",
  "nap": "\u2249",
  "napprox": "\u2249",
  "NotVerticalBar": "\u2224",
  "nmid": "\u2224",
  "nshortmid": "\u2224",
  "nsmid": "\u2224",
  "Nscr": "\u{1D4A9}",
  "Ntilde": "\xD1",
  "Nu": "\u039D",
  "OElig": "\u0152",
  "Oacute": "\xD3",
  "Ocirc": "\xD4",
  "Ocy": "\u041E",
  "Odblac": "\u0150",
  "Ofr": "\u{1D512}",
  "Ograve": "\xD2",
  "Omacr": "\u014C",
  "Omega": "\u03A9",
  "ohm": "\u03A9",
  "Omicron": "\u039F",
  "Oopf": "\u{1D546}",
  "OpenCurlyDoubleQuote": "\u201C",
  "ldquo": "\u201C",
  "OpenCurlyQuote": "\u2018",
  "lsquo": "\u2018",
  "Or": "\u2A54",
  "Oscr": "\u{1D4AA}",
  "Oslash": "\xD8",
  "Otilde": "\xD5",
  "Otimes": "\u2A37",
  "Ouml": "\xD6",
  "OverBar": "\u203E",
  "oline": "\u203E",
  "OverBrace": "\u23DE",
  "OverBracket": "\u23B4",
  "tbrk": "\u23B4",
  "OverParenthesis": "\u23DC",
  "PartialD": "\u2202",
  "part": "\u2202",
  "Pcy": "\u041F",
  "Pfr": "\u{1D513}",
  "Phi": "\u03A6",
  "Pi": "\u03A0",
  "PlusMinus": "\xB1",
  "plusmn": "\xB1",
  "pm": "\xB1",
  "Popf": "\u2119",
  "primes": "\u2119",
  "Pr": "\u2ABB",
  "Precedes": "\u227A",
  "pr": "\u227A",
  "prec": "\u227A",
  "PrecedesEqual": "\u2AAF",
  "pre": "\u2AAF",
  "preceq": "\u2AAF",
  "PrecedesSlantEqual": "\u227C",
  "prcue": "\u227C",
  "preccurlyeq": "\u227C",
  "PrecedesTilde": "\u227E",
  "precsim": "\u227E",
  "prsim": "\u227E",
  "Prime": "\u2033",
  "Product": "\u220F",
  "prod": "\u220F",
  "Proportional": "\u221D",
  "prop": "\u221D",
  "propto": "\u221D",
  "varpropto": "\u221D",
  "vprop": "\u221D",
  "Pscr": "\u{1D4AB}",
  "Psi": "\u03A8",
  "QUOT": '"',
  "quot": '"',
  "Qfr": "\u{1D514}",
  "Qopf": "\u211A",
  "rationals": "\u211A",
  "Qscr": "\u{1D4AC}",
  "RBarr": "\u2910",
  "drbkarow": "\u2910",
  "REG": "\xAE",
  "circledR": "\xAE",
  "reg": "\xAE",
  "Racute": "\u0154",
  "Rang": "\u27EB",
  "Rarr": "\u21A0",
  "twoheadrightarrow": "\u21A0",
  "Rarrtl": "\u2916",
  "Rcaron": "\u0158",
  "Rcedil": "\u0156",
  "Rcy": "\u0420",
  "Re": "\u211C",
  "Rfr": "\u211C",
  "real": "\u211C",
  "realpart": "\u211C",
  "ReverseElement": "\u220B",
  "SuchThat": "\u220B",
  "ni": "\u220B",
  "niv": "\u220B",
  "ReverseEquilibrium": "\u21CB",
  "leftrightharpoons": "\u21CB",
  "lrhar": "\u21CB",
  "ReverseUpEquilibrium": "\u296F",
  "duhar": "\u296F",
  "Rho": "\u03A1",
  "RightAngleBracket": "\u27E9",
  "rang": "\u27E9",
  "rangle": "\u27E9",
  "RightArrow": "\u2192",
  "ShortRightArrow": "\u2192",
  "rarr": "\u2192",
  "rightarrow": "\u2192",
  "srarr": "\u2192",
  "RightArrowBar": "\u21E5",
  "rarrb": "\u21E5",
  "RightArrowLeftArrow": "\u21C4",
  "rightleftarrows": "\u21C4",
  "rlarr": "\u21C4",
  "RightCeiling": "\u2309",
  "rceil": "\u2309",
  "RightDoubleBracket": "\u27E7",
  "robrk": "\u27E7",
  "RightDownTeeVector": "\u295D",
  "RightDownVector": "\u21C2",
  "dharr": "\u21C2",
  "downharpoonright": "\u21C2",
  "RightDownVectorBar": "\u2955",
  "RightFloor": "\u230B",
  "rfloor": "\u230B",
  "RightTee": "\u22A2",
  "vdash": "\u22A2",
  "RightTeeArrow": "\u21A6",
  "map": "\u21A6",
  "mapsto": "\u21A6",
  "RightTeeVector": "\u295B",
  "RightTriangle": "\u22B3",
  "vartriangleright": "\u22B3",
  "vrtri": "\u22B3",
  "RightTriangleBar": "\u29D0",
  "RightTriangleEqual": "\u22B5",
  "rtrie": "\u22B5",
  "trianglerighteq": "\u22B5",
  "RightUpDownVector": "\u294F",
  "RightUpTeeVector": "\u295C",
  "RightUpVector": "\u21BE",
  "uharr": "\u21BE",
  "upharpoonright": "\u21BE",
  "RightUpVectorBar": "\u2954",
  "RightVector": "\u21C0",
  "rharu": "\u21C0",
  "rightharpoonup": "\u21C0",
  "RightVectorBar": "\u2953",
  "Ropf": "\u211D",
  "reals": "\u211D",
  "RoundImplies": "\u2970",
  "Rrightarrow": "\u21DB",
  "rAarr": "\u21DB",
  "Rscr": "\u211B",
  "realine": "\u211B",
  "Rsh": "\u21B1",
  "rsh": "\u21B1",
  "RuleDelayed": "\u29F4",
  "SHCHcy": "\u0429",
  "SHcy": "\u0428",
  "SOFTcy": "\u042C",
  "Sacute": "\u015A",
  "Sc": "\u2ABC",
  "Scaron": "\u0160",
  "Scedil": "\u015E",
  "Scirc": "\u015C",
  "Scy": "\u0421",
  "Sfr": "\u{1D516}",
  "ShortUpArrow": "\u2191",
  "UpArrow": "\u2191",
  "uarr": "\u2191",
  "uparrow": "\u2191",
  "Sigma": "\u03A3",
  "SmallCircle": "\u2218",
  "compfn": "\u2218",
  "Sopf": "\u{1D54A}",
  "Sqrt": "\u221A",
  "radic": "\u221A",
  "Square": "\u25A1",
  "squ": "\u25A1",
  "square": "\u25A1",
  "SquareIntersection": "\u2293",
  "sqcap": "\u2293",
  "SquareSubset": "\u228F",
  "sqsub": "\u228F",
  "sqsubset": "\u228F",
  "SquareSubsetEqual": "\u2291",
  "sqsube": "\u2291",
  "sqsubseteq": "\u2291",
  "SquareSuperset": "\u2290",
  "sqsup": "\u2290",
  "sqsupset": "\u2290",
  "SquareSupersetEqual": "\u2292",
  "sqsupe": "\u2292",
  "sqsupseteq": "\u2292",
  "SquareUnion": "\u2294",
  "sqcup": "\u2294",
  "Sscr": "\u{1D4AE}",
  "Star": "\u22C6",
  "sstarf": "\u22C6",
  "Sub": "\u22D0",
  "Subset": "\u22D0",
  "SubsetEqual": "\u2286",
  "sube": "\u2286",
  "subseteq": "\u2286",
  "Succeeds": "\u227B",
  "sc": "\u227B",
  "succ": "\u227B",
  "SucceedsEqual": "\u2AB0",
  "sce": "\u2AB0",
  "succeq": "\u2AB0",
  "SucceedsSlantEqual": "\u227D",
  "sccue": "\u227D",
  "succcurlyeq": "\u227D",
  "SucceedsTilde": "\u227F",
  "scsim": "\u227F",
  "succsim": "\u227F",
  "Sum": "\u2211",
  "sum": "\u2211",
  "Sup": "\u22D1",
  "Supset": "\u22D1",
  "Superset": "\u2283",
  "sup": "\u2283",
  "supset": "\u2283",
  "SupersetEqual": "\u2287",
  "supe": "\u2287",
  "supseteq": "\u2287",
  "THORN": "\xDE",
  "TRADE": "\u2122",
  "trade": "\u2122",
  "TSHcy": "\u040B",
  "TScy": "\u0426",
  "Tab": "	",
  "Tau": "\u03A4",
  "Tcaron": "\u0164",
  "Tcedil": "\u0162",
  "Tcy": "\u0422",
  "Tfr": "\u{1D517}",
  "Therefore": "\u2234",
  "there4": "\u2234",
  "therefore": "\u2234",
  "Theta": "\u0398",
  "ThickSpace": "\u205F\u200A",
  "ThinSpace": "\u2009",
  "thinsp": "\u2009",
  "Tilde": "\u223C",
  "sim": "\u223C",
  "thicksim": "\u223C",
  "thksim": "\u223C",
  "TildeEqual": "\u2243",
  "sime": "\u2243",
  "simeq": "\u2243",
  "TildeFullEqual": "\u2245",
  "cong": "\u2245",
  "TildeTilde": "\u2248",
  "ap": "\u2248",
  "approx": "\u2248",
  "asymp": "\u2248",
  "thickapprox": "\u2248",
  "thkap": "\u2248",
  "Topf": "\u{1D54B}",
  "TripleDot": "\u20DB",
  "tdot": "\u20DB",
  "Tscr": "\u{1D4AF}",
  "Tstrok": "\u0166",
  "Uacute": "\xDA",
  "Uarr": "\u219F",
  "Uarrocir": "\u2949",
  "Ubrcy": "\u040E",
  "Ubreve": "\u016C",
  "Ucirc": "\xDB",
  "Ucy": "\u0423",
  "Udblac": "\u0170",
  "Ufr": "\u{1D518}",
  "Ugrave": "\xD9",
  "Umacr": "\u016A",
  "UnderBar": "_",
  "lowbar": "_",
  "UnderBrace": "\u23DF",
  "UnderBracket": "\u23B5",
  "bbrk": "\u23B5",
  "UnderParenthesis": "\u23DD",
  "Union": "\u22C3",
  "bigcup": "\u22C3",
  "xcup": "\u22C3",
  "UnionPlus": "\u228E",
  "uplus": "\u228E",
  "Uogon": "\u0172",
  "Uopf": "\u{1D54C}",
  "UpArrowBar": "\u2912",
  "UpArrowDownArrow": "\u21C5",
  "udarr": "\u21C5",
  "UpDownArrow": "\u2195",
  "updownarrow": "\u2195",
  "varr": "\u2195",
  "UpEquilibrium": "\u296E",
  "udhar": "\u296E",
  "UpTee": "\u22A5",
  "bot": "\u22A5",
  "bottom": "\u22A5",
  "perp": "\u22A5",
  "UpTeeArrow": "\u21A5",
  "mapstoup": "\u21A5",
  "UpperLeftArrow": "\u2196",
  "nwarr": "\u2196",
  "nwarrow": "\u2196",
  "UpperRightArrow": "\u2197",
  "nearr": "\u2197",
  "nearrow": "\u2197",
  "Upsi": "\u03D2",
  "upsih": "\u03D2",
  "Upsilon": "\u03A5",
  "Uring": "\u016E",
  "Uscr": "\u{1D4B0}",
  "Utilde": "\u0168",
  "Uuml": "\xDC",
  "VDash": "\u22AB",
  "Vbar": "\u2AEB",
  "Vcy": "\u0412",
  "Vdash": "\u22A9",
  "Vdashl": "\u2AE6",
  "Vee": "\u22C1",
  "bigvee": "\u22C1",
  "xvee": "\u22C1",
  "Verbar": "\u2016",
  "Vert": "\u2016",
  "VerticalBar": "\u2223",
  "mid": "\u2223",
  "shortmid": "\u2223",
  "smid": "\u2223",
  "VerticalLine": "|",
  "verbar": "|",
  "vert": "|",
  "VerticalSeparator": "\u2758",
  "VerticalTilde": "\u2240",
  "wr": "\u2240",
  "wreath": "\u2240",
  "VeryThinSpace": "\u200A",
  "hairsp": "\u200A",
  "Vfr": "\u{1D519}",
  "Vopf": "\u{1D54D}",
  "Vscr": "\u{1D4B1}",
  "Vvdash": "\u22AA",
  "Wcirc": "\u0174",
  "Wedge": "\u22C0",
  "bigwedge": "\u22C0",
  "xwedge": "\u22C0",
  "Wfr": "\u{1D51A}",
  "Wopf": "\u{1D54E}",
  "Wscr": "\u{1D4B2}",
  "Xfr": "\u{1D51B}",
  "Xi": "\u039E",
  "Xopf": "\u{1D54F}",
  "Xscr": "\u{1D4B3}",
  "YAcy": "\u042F",
  "YIcy": "\u0407",
  "YUcy": "\u042E",
  "Yacute": "\xDD",
  "Ycirc": "\u0176",
  "Ycy": "\u042B",
  "Yfr": "\u{1D51C}",
  "Yopf": "\u{1D550}",
  "Yscr": "\u{1D4B4}",
  "Yuml": "\u0178",
  "ZHcy": "\u0416",
  "Zacute": "\u0179",
  "Zcaron": "\u017D",
  "Zcy": "\u0417",
  "Zdot": "\u017B",
  "Zeta": "\u0396",
  "Zfr": "\u2128",
  "zeetrf": "\u2128",
  "Zopf": "\u2124",
  "integers": "\u2124",
  "Zscr": "\u{1D4B5}",
  "aacute": "\xE1",
  "abreve": "\u0103",
  "ac": "\u223E",
  "mstpos": "\u223E",
  "acE": "\u223E\u0333",
  "acd": "\u223F",
  "acirc": "\xE2",
  "acy": "\u0430",
  "aelig": "\xE6",
  "afr": "\u{1D51E}",
  "agrave": "\xE0",
  "alefsym": "\u2135",
  "aleph": "\u2135",
  "alpha": "\u03B1",
  "amacr": "\u0101",
  "amalg": "\u2A3F",
  "and": "\u2227",
  "wedge": "\u2227",
  "andand": "\u2A55",
  "andd": "\u2A5C",
  "andslope": "\u2A58",
  "andv": "\u2A5A",
  "ang": "\u2220",
  "angle": "\u2220",
  "ange": "\u29A4",
  "angmsd": "\u2221",
  "measuredangle": "\u2221",
  "angmsdaa": "\u29A8",
  "angmsdab": "\u29A9",
  "angmsdac": "\u29AA",
  "angmsdad": "\u29AB",
  "angmsdae": "\u29AC",
  "angmsdaf": "\u29AD",
  "angmsdag": "\u29AE",
  "angmsdah": "\u29AF",
  "angrt": "\u221F",
  "angrtvb": "\u22BE",
  "angrtvbd": "\u299D",
  "angsph": "\u2222",
  "angzarr": "\u237C",
  "aogon": "\u0105",
  "aopf": "\u{1D552}",
  "apE": "\u2A70",
  "apacir": "\u2A6F",
  "ape": "\u224A",
  "approxeq": "\u224A",
  "apid": "\u224B",
  "apos": "'",
  "aring": "\xE5",
  "ascr": "\u{1D4B6}",
  "ast": "*",
  "midast": "*",
  "atilde": "\xE3",
  "auml": "\xE4",
  "awint": "\u2A11",
  "bNot": "\u2AED",
  "backcong": "\u224C",
  "bcong": "\u224C",
  "backepsilon": "\u03F6",
  "bepsi": "\u03F6",
  "backprime": "\u2035",
  "bprime": "\u2035",
  "backsim": "\u223D",
  "bsim": "\u223D",
  "backsimeq": "\u22CD",
  "bsime": "\u22CD",
  "barvee": "\u22BD",
  "barwed": "\u2305",
  "barwedge": "\u2305",
  "bbrktbrk": "\u23B6",
  "bcy": "\u0431",
  "bdquo": "\u201E",
  "ldquor": "\u201E",
  "bemptyv": "\u29B0",
  "beta": "\u03B2",
  "beth": "\u2136",
  "between": "\u226C",
  "twixt": "\u226C",
  "bfr": "\u{1D51F}",
  "bigcirc": "\u25EF",
  "xcirc": "\u25EF",
  "bigodot": "\u2A00",
  "xodot": "\u2A00",
  "bigoplus": "\u2A01",
  "xoplus": "\u2A01",
  "bigotimes": "\u2A02",
  "xotime": "\u2A02",
  "bigsqcup": "\u2A06",
  "xsqcup": "\u2A06",
  "bigstar": "\u2605",
  "starf": "\u2605",
  "bigtriangledown": "\u25BD",
  "xdtri": "\u25BD",
  "bigtriangleup": "\u25B3",
  "xutri": "\u25B3",
  "biguplus": "\u2A04",
  "xuplus": "\u2A04",
  "bkarow": "\u290D",
  "rbarr": "\u290D",
  "blacklozenge": "\u29EB",
  "lozf": "\u29EB",
  "blacktriangle": "\u25B4",
  "utrif": "\u25B4",
  "blacktriangledown": "\u25BE",
  "dtrif": "\u25BE",
  "blacktriangleleft": "\u25C2",
  "ltrif": "\u25C2",
  "blacktriangleright": "\u25B8",
  "rtrif": "\u25B8",
  "blank": "\u2423",
  "blk12": "\u2592",
  "blk14": "\u2591",
  "blk34": "\u2593",
  "block": "\u2588",
  "bne": "=\u20E5",
  "bnequiv": "\u2261\u20E5",
  "bnot": "\u2310",
  "bopf": "\u{1D553}",
  "bowtie": "\u22C8",
  "boxDL": "\u2557",
  "boxDR": "\u2554",
  "boxDl": "\u2556",
  "boxDr": "\u2553",
  "boxH": "\u2550",
  "boxHD": "\u2566",
  "boxHU": "\u2569",
  "boxHd": "\u2564",
  "boxHu": "\u2567",
  "boxUL": "\u255D",
  "boxUR": "\u255A",
  "boxUl": "\u255C",
  "boxUr": "\u2559",
  "boxV": "\u2551",
  "boxVH": "\u256C",
  "boxVL": "\u2563",
  "boxVR": "\u2560",
  "boxVh": "\u256B",
  "boxVl": "\u2562",
  "boxVr": "\u255F",
  "boxbox": "\u29C9",
  "boxdL": "\u2555",
  "boxdR": "\u2552",
  "boxdl": "\u2510",
  "boxdr": "\u250C",
  "boxhD": "\u2565",
  "boxhU": "\u2568",
  "boxhd": "\u252C",
  "boxhu": "\u2534",
  "boxminus": "\u229F",
  "minusb": "\u229F",
  "boxplus": "\u229E",
  "plusb": "\u229E",
  "boxtimes": "\u22A0",
  "timesb": "\u22A0",
  "boxuL": "\u255B",
  "boxuR": "\u2558",
  "boxul": "\u2518",
  "boxur": "\u2514",
  "boxv": "\u2502",
  "boxvH": "\u256A",
  "boxvL": "\u2561",
  "boxvR": "\u255E",
  "boxvh": "\u253C",
  "boxvl": "\u2524",
  "boxvr": "\u251C",
  "brvbar": "\xA6",
  "bscr": "\u{1D4B7}",
  "bsemi": "\u204F",
  "bsol": "\\",
  "bsolb": "\u29C5",
  "bsolhsub": "\u27C8",
  "bull": "\u2022",
  "bullet": "\u2022",
  "bumpE": "\u2AAE",
  "cacute": "\u0107",
  "cap": "\u2229",
  "capand": "\u2A44",
  "capbrcup": "\u2A49",
  "capcap": "\u2A4B",
  "capcup": "\u2A47",
  "capdot": "\u2A40",
  "caps": "\u2229\uFE00",
  "caret": "\u2041",
  "ccaps": "\u2A4D",
  "ccaron": "\u010D",
  "ccedil": "\xE7",
  "ccirc": "\u0109",
  "ccups": "\u2A4C",
  "ccupssm": "\u2A50",
  "cdot": "\u010B",
  "cemptyv": "\u29B2",
  "cent": "\xA2",
  "cfr": "\u{1D520}",
  "chcy": "\u0447",
  "check": "\u2713",
  "checkmark": "\u2713",
  "chi": "\u03C7",
  "cir": "\u25CB",
  "cirE": "\u29C3",
  "circ": "\u02C6",
  "circeq": "\u2257",
  "cire": "\u2257",
  "circlearrowleft": "\u21BA",
  "olarr": "\u21BA",
  "circlearrowright": "\u21BB",
  "orarr": "\u21BB",
  "circledS": "\u24C8",
  "oS": "\u24C8",
  "circledast": "\u229B",
  "oast": "\u229B",
  "circledcirc": "\u229A",
  "ocir": "\u229A",
  "circleddash": "\u229D",
  "odash": "\u229D",
  "cirfnint": "\u2A10",
  "cirmid": "\u2AEF",
  "cirscir": "\u29C2",
  "clubs": "\u2663",
  "clubsuit": "\u2663",
  "colon": ":",
  "comma": ",",
  "commat": "@",
  "comp": "\u2201",
  "complement": "\u2201",
  "congdot": "\u2A6D",
  "copf": "\u{1D554}",
  "copysr": "\u2117",
  "crarr": "\u21B5",
  "cross": "\u2717",
  "cscr": "\u{1D4B8}",
  "csub": "\u2ACF",
  "csube": "\u2AD1",
  "csup": "\u2AD0",
  "csupe": "\u2AD2",
  "ctdot": "\u22EF",
  "cudarrl": "\u2938",
  "cudarrr": "\u2935",
  "cuepr": "\u22DE",
  "curlyeqprec": "\u22DE",
  "cuesc": "\u22DF",
  "curlyeqsucc": "\u22DF",
  "cularr": "\u21B6",
  "curvearrowleft": "\u21B6",
  "cularrp": "\u293D",
  "cup": "\u222A",
  "cupbrcap": "\u2A48",
  "cupcap": "\u2A46",
  "cupcup": "\u2A4A",
  "cupdot": "\u228D",
  "cupor": "\u2A45",
  "cups": "\u222A\uFE00",
  "curarr": "\u21B7",
  "curvearrowright": "\u21B7",
  "curarrm": "\u293C",
  "curlyvee": "\u22CE",
  "cuvee": "\u22CE",
  "curlywedge": "\u22CF",
  "cuwed": "\u22CF",
  "curren": "\xA4",
  "cwint": "\u2231",
  "cylcty": "\u232D",
  "dHar": "\u2965",
  "dagger": "\u2020",
  "daleth": "\u2138",
  "dash": "\u2010",
  "hyphen": "\u2010",
  "dbkarow": "\u290F",
  "rBarr": "\u290F",
  "dcaron": "\u010F",
  "dcy": "\u0434",
  "ddarr": "\u21CA",
  "downdownarrows": "\u21CA",
  "ddotseq": "\u2A77",
  "eDDot": "\u2A77",
  "deg": "\xB0",
  "delta": "\u03B4",
  "demptyv": "\u29B1",
  "dfisht": "\u297F",
  "dfr": "\u{1D521}",
  "diamondsuit": "\u2666",
  "diams": "\u2666",
  "digamma": "\u03DD",
  "gammad": "\u03DD",
  "disin": "\u22F2",
  "div": "\xF7",
  "divide": "\xF7",
  "divideontimes": "\u22C7",
  "divonx": "\u22C7",
  "djcy": "\u0452",
  "dlcorn": "\u231E",
  "llcorner": "\u231E",
  "dlcrop": "\u230D",
  "dollar": "$",
  "dopf": "\u{1D555}",
  "doteqdot": "\u2251",
  "eDot": "\u2251",
  "dotminus": "\u2238",
  "minusd": "\u2238",
  "dotplus": "\u2214",
  "plusdo": "\u2214",
  "dotsquare": "\u22A1",
  "sdotb": "\u22A1",
  "drcorn": "\u231F",
  "lrcorner": "\u231F",
  "drcrop": "\u230C",
  "dscr": "\u{1D4B9}",
  "dscy": "\u0455",
  "dsol": "\u29F6",
  "dstrok": "\u0111",
  "dtdot": "\u22F1",
  "dtri": "\u25BF",
  "triangledown": "\u25BF",
  "dwangle": "\u29A6",
  "dzcy": "\u045F",
  "dzigrarr": "\u27FF",
  "eacute": "\xE9",
  "easter": "\u2A6E",
  "ecaron": "\u011B",
  "ecir": "\u2256",
  "eqcirc": "\u2256",
  "ecirc": "\xEA",
  "ecolon": "\u2255",
  "eqcolon": "\u2255",
  "ecy": "\u044D",
  "edot": "\u0117",
  "efDot": "\u2252",
  "fallingdotseq": "\u2252",
  "efr": "\u{1D522}",
  "eg": "\u2A9A",
  "egrave": "\xE8",
  "egs": "\u2A96",
  "eqslantgtr": "\u2A96",
  "egsdot": "\u2A98",
  "el": "\u2A99",
  "elinters": "\u23E7",
  "ell": "\u2113",
  "els": "\u2A95",
  "eqslantless": "\u2A95",
  "elsdot": "\u2A97",
  "emacr": "\u0113",
  "empty": "\u2205",
  "emptyset": "\u2205",
  "emptyv": "\u2205",
  "varnothing": "\u2205",
  "emsp13": "\u2004",
  "emsp14": "\u2005",
  "emsp": "\u2003",
  "eng": "\u014B",
  "ensp": "\u2002",
  "eogon": "\u0119",
  "eopf": "\u{1D556}",
  "epar": "\u22D5",
  "eparsl": "\u29E3",
  "eplus": "\u2A71",
  "epsi": "\u03B5",
  "epsilon": "\u03B5",
  "epsiv": "\u03F5",
  "straightepsilon": "\u03F5",
  "varepsilon": "\u03F5",
  "equals": "=",
  "equest": "\u225F",
  "questeq": "\u225F",
  "equivDD": "\u2A78",
  "eqvparsl": "\u29E5",
  "erDot": "\u2253",
  "risingdotseq": "\u2253",
  "erarr": "\u2971",
  "escr": "\u212F",
  "eta": "\u03B7",
  "eth": "\xF0",
  "euml": "\xEB",
  "euro": "\u20AC",
  "excl": "!",
  "fcy": "\u0444",
  "female": "\u2640",
  "ffilig": "\uFB03",
  "fflig": "\uFB00",
  "ffllig": "\uFB04",
  "ffr": "\u{1D523}",
  "filig": "\uFB01",
  "fjlig": "fj",
  "flat": "\u266D",
  "fllig": "\uFB02",
  "fltns": "\u25B1",
  "fnof": "\u0192",
  "fopf": "\u{1D557}",
  "fork": "\u22D4",
  "pitchfork": "\u22D4",
  "forkv": "\u2AD9",
  "fpartint": "\u2A0D",
  "frac12": "\xBD",
  "half": "\xBD",
  "frac13": "\u2153",
  "frac14": "\xBC",
  "frac15": "\u2155",
  "frac16": "\u2159",
  "frac18": "\u215B",
  "frac23": "\u2154",
  "frac25": "\u2156",
  "frac34": "\xBE",
  "frac35": "\u2157",
  "frac38": "\u215C",
  "frac45": "\u2158",
  "frac56": "\u215A",
  "frac58": "\u215D",
  "frac78": "\u215E",
  "frasl": "\u2044",
  "frown": "\u2322",
  "sfrown": "\u2322",
  "fscr": "\u{1D4BB}",
  "gEl": "\u2A8C",
  "gtreqqless": "\u2A8C",
  "gacute": "\u01F5",
  "gamma": "\u03B3",
  "gap": "\u2A86",
  "gtrapprox": "\u2A86",
  "gbreve": "\u011F",
  "gcirc": "\u011D",
  "gcy": "\u0433",
  "gdot": "\u0121",
  "gescc": "\u2AA9",
  "gesdot": "\u2A80",
  "gesdoto": "\u2A82",
  "gesdotol": "\u2A84",
  "gesl": "\u22DB\uFE00",
  "gesles": "\u2A94",
  "gfr": "\u{1D524}",
  "gimel": "\u2137",
  "gjcy": "\u0453",
  "glE": "\u2A92",
  "gla": "\u2AA5",
  "glj": "\u2AA4",
  "gnE": "\u2269",
  "gneqq": "\u2269",
  "gnap": "\u2A8A",
  "gnapprox": "\u2A8A",
  "gne": "\u2A88",
  "gneq": "\u2A88",
  "gnsim": "\u22E7",
  "gopf": "\u{1D558}",
  "gscr": "\u210A",
  "gsime": "\u2A8E",
  "gsiml": "\u2A90",
  "gtcc": "\u2AA7",
  "gtcir": "\u2A7A",
  "gtdot": "\u22D7",
  "gtrdot": "\u22D7",
  "gtlPar": "\u2995",
  "gtquest": "\u2A7C",
  "gtrarr": "\u2978",
  "gvertneqq": "\u2269\uFE00",
  "gvnE": "\u2269\uFE00",
  "hardcy": "\u044A",
  "harrcir": "\u2948",
  "harrw": "\u21AD",
  "leftrightsquigarrow": "\u21AD",
  "hbar": "\u210F",
  "hslash": "\u210F",
  "planck": "\u210F",
  "plankv": "\u210F",
  "hcirc": "\u0125",
  "hearts": "\u2665",
  "heartsuit": "\u2665",
  "hellip": "\u2026",
  "mldr": "\u2026",
  "hercon": "\u22B9",
  "hfr": "\u{1D525}",
  "hksearow": "\u2925",
  "searhk": "\u2925",
  "hkswarow": "\u2926",
  "swarhk": "\u2926",
  "hoarr": "\u21FF",
  "homtht": "\u223B",
  "hookleftarrow": "\u21A9",
  "larrhk": "\u21A9",
  "hookrightarrow": "\u21AA",
  "rarrhk": "\u21AA",
  "hopf": "\u{1D559}",
  "horbar": "\u2015",
  "hscr": "\u{1D4BD}",
  "hstrok": "\u0127",
  "hybull": "\u2043",
  "iacute": "\xED",
  "icirc": "\xEE",
  "icy": "\u0438",
  "iecy": "\u0435",
  "iexcl": "\xA1",
  "ifr": "\u{1D526}",
  "igrave": "\xEC",
  "iiiint": "\u2A0C",
  "qint": "\u2A0C",
  "iiint": "\u222D",
  "tint": "\u222D",
  "iinfin": "\u29DC",
  "iiota": "\u2129",
  "ijlig": "\u0133",
  "imacr": "\u012B",
  "imath": "\u0131",
  "inodot": "\u0131",
  "imof": "\u22B7",
  "imped": "\u01B5",
  "incare": "\u2105",
  "infin": "\u221E",
  "infintie": "\u29DD",
  "intcal": "\u22BA",
  "intercal": "\u22BA",
  "intlarhk": "\u2A17",
  "intprod": "\u2A3C",
  "iprod": "\u2A3C",
  "iocy": "\u0451",
  "iogon": "\u012F",
  "iopf": "\u{1D55A}",
  "iota": "\u03B9",
  "iquest": "\xBF",
  "iscr": "\u{1D4BE}",
  "isinE": "\u22F9",
  "isindot": "\u22F5",
  "isins": "\u22F4",
  "isinsv": "\u22F3",
  "itilde": "\u0129",
  "iukcy": "\u0456",
  "iuml": "\xEF",
  "jcirc": "\u0135",
  "jcy": "\u0439",
  "jfr": "\u{1D527}",
  "jmath": "\u0237",
  "jopf": "\u{1D55B}",
  "jscr": "\u{1D4BF}",
  "jsercy": "\u0458",
  "jukcy": "\u0454",
  "kappa": "\u03BA",
  "kappav": "\u03F0",
  "varkappa": "\u03F0",
  "kcedil": "\u0137",
  "kcy": "\u043A",
  "kfr": "\u{1D528}",
  "kgreen": "\u0138",
  "khcy": "\u0445",
  "kjcy": "\u045C",
  "kopf": "\u{1D55C}",
  "kscr": "\u{1D4C0}",
  "lAtail": "\u291B",
  "lBarr": "\u290E",
  "lEg": "\u2A8B",
  "lesseqqgtr": "\u2A8B",
  "lHar": "\u2962",
  "lacute": "\u013A",
  "laemptyv": "\u29B4",
  "lambda": "\u03BB",
  "langd": "\u2991",
  "lap": "\u2A85",
  "lessapprox": "\u2A85",
  "laquo": "\xAB",
  "larrbfs": "\u291F",
  "larrfs": "\u291D",
  "larrlp": "\u21AB",
  "looparrowleft": "\u21AB",
  "larrpl": "\u2939",
  "larrsim": "\u2973",
  "larrtl": "\u21A2",
  "leftarrowtail": "\u21A2",
  "lat": "\u2AAB",
  "latail": "\u2919",
  "late": "\u2AAD",
  "lates": "\u2AAD\uFE00",
  "lbarr": "\u290C",
  "lbbrk": "\u2772",
  "lbrace": "{",
  "lcub": "{",
  "lbrack": "[",
  "lsqb": "[",
  "lbrke": "\u298B",
  "lbrksld": "\u298F",
  "lbrkslu": "\u298D",
  "lcaron": "\u013E",
  "lcedil": "\u013C",
  "lcy": "\u043B",
  "ldca": "\u2936",
  "ldrdhar": "\u2967",
  "ldrushar": "\u294B",
  "ldsh": "\u21B2",
  "le": "\u2264",
  "leq": "\u2264",
  "leftleftarrows": "\u21C7",
  "llarr": "\u21C7",
  "leftthreetimes": "\u22CB",
  "lthree": "\u22CB",
  "lescc": "\u2AA8",
  "lesdot": "\u2A7F",
  "lesdoto": "\u2A81",
  "lesdotor": "\u2A83",
  "lesg": "\u22DA\uFE00",
  "lesges": "\u2A93",
  "lessdot": "\u22D6",
  "ltdot": "\u22D6",
  "lfisht": "\u297C",
  "lfr": "\u{1D529}",
  "lgE": "\u2A91",
  "lharul": "\u296A",
  "lhblk": "\u2584",
  "ljcy": "\u0459",
  "llhard": "\u296B",
  "lltri": "\u25FA",
  "lmidot": "\u0140",
  "lmoust": "\u23B0",
  "lmoustache": "\u23B0",
  "lnE": "\u2268",
  "lneqq": "\u2268",
  "lnap": "\u2A89",
  "lnapprox": "\u2A89",
  "lne": "\u2A87",
  "lneq": "\u2A87",
  "lnsim": "\u22E6",
  "loang": "\u27EC",
  "loarr": "\u21FD",
  "longmapsto": "\u27FC",
  "xmap": "\u27FC",
  "looparrowright": "\u21AC",
  "rarrlp": "\u21AC",
  "lopar": "\u2985",
  "lopf": "\u{1D55D}",
  "loplus": "\u2A2D",
  "lotimes": "\u2A34",
  "lowast": "\u2217",
  "loz": "\u25CA",
  "lozenge": "\u25CA",
  "lpar": "(",
  "lparlt": "\u2993",
  "lrhard": "\u296D",
  "lrm": "\u200E",
  "lrtri": "\u22BF",
  "lsaquo": "\u2039",
  "lscr": "\u{1D4C1}",
  "lsime": "\u2A8D",
  "lsimg": "\u2A8F",
  "lsquor": "\u201A",
  "sbquo": "\u201A",
  "lstrok": "\u0142",
  "ltcc": "\u2AA6",
  "ltcir": "\u2A79",
  "ltimes": "\u22C9",
  "ltlarr": "\u2976",
  "ltquest": "\u2A7B",
  "ltrPar": "\u2996",
  "ltri": "\u25C3",
  "triangleleft": "\u25C3",
  "lurdshar": "\u294A",
  "luruhar": "\u2966",
  "lvertneqq": "\u2268\uFE00",
  "lvnE": "\u2268\uFE00",
  "mDDot": "\u223A",
  "macr": "\xAF",
  "strns": "\xAF",
  "male": "\u2642",
  "malt": "\u2720",
  "maltese": "\u2720",
  "marker": "\u25AE",
  "mcomma": "\u2A29",
  "mcy": "\u043C",
  "mdash": "\u2014",
  "mfr": "\u{1D52A}",
  "mho": "\u2127",
  "micro": "\xB5",
  "midcir": "\u2AF0",
  "minus": "\u2212",
  "minusdu": "\u2A2A",
  "mlcp": "\u2ADB",
  "models": "\u22A7",
  "mopf": "\u{1D55E}",
  "mscr": "\u{1D4C2}",
  "mu": "\u03BC",
  "multimap": "\u22B8",
  "mumap": "\u22B8",
  "nGg": "\u22D9\u0338",
  "nGt": "\u226B\u20D2",
  "nLeftarrow": "\u21CD",
  "nlArr": "\u21CD",
  "nLeftrightarrow": "\u21CE",
  "nhArr": "\u21CE",
  "nLl": "\u22D8\u0338",
  "nLt": "\u226A\u20D2",
  "nRightarrow": "\u21CF",
  "nrArr": "\u21CF",
  "nVDash": "\u22AF",
  "nVdash": "\u22AE",
  "nacute": "\u0144",
  "nang": "\u2220\u20D2",
  "napE": "\u2A70\u0338",
  "napid": "\u224B\u0338",
  "napos": "\u0149",
  "natur": "\u266E",
  "natural": "\u266E",
  "ncap": "\u2A43",
  "ncaron": "\u0148",
  "ncedil": "\u0146",
  "ncongdot": "\u2A6D\u0338",
  "ncup": "\u2A42",
  "ncy": "\u043D",
  "ndash": "\u2013",
  "neArr": "\u21D7",
  "nearhk": "\u2924",
  "nedot": "\u2250\u0338",
  "nesear": "\u2928",
  "toea": "\u2928",
  "nfr": "\u{1D52B}",
  "nharr": "\u21AE",
  "nleftrightarrow": "\u21AE",
  "nhpar": "\u2AF2",
  "nis": "\u22FC",
  "nisd": "\u22FA",
  "njcy": "\u045A",
  "nlE": "\u2266\u0338",
  "nleqq": "\u2266\u0338",
  "nlarr": "\u219A",
  "nleftarrow": "\u219A",
  "nldr": "\u2025",
  "nopf": "\u{1D55F}",
  "not": "\xAC",
  "notinE": "\u22F9\u0338",
  "notindot": "\u22F5\u0338",
  "notinvb": "\u22F7",
  "notinvc": "\u22F6",
  "notnivb": "\u22FE",
  "notnivc": "\u22FD",
  "nparsl": "\u2AFD\u20E5",
  "npart": "\u2202\u0338",
  "npolint": "\u2A14",
  "nrarr": "\u219B",
  "nrightarrow": "\u219B",
  "nrarrc": "\u2933\u0338",
  "nrarrw": "\u219D\u0338",
  "nscr": "\u{1D4C3}",
  "nsub": "\u2284",
  "nsubE": "\u2AC5\u0338",
  "nsubseteqq": "\u2AC5\u0338",
  "nsup": "\u2285",
  "nsupE": "\u2AC6\u0338",
  "nsupseteqq": "\u2AC6\u0338",
  "ntilde": "\xF1",
  "nu": "\u03BD",
  "num": "#",
  "numero": "\u2116",
  "numsp": "\u2007",
  "nvDash": "\u22AD",
  "nvHarr": "\u2904",
  "nvap": "\u224D\u20D2",
  "nvdash": "\u22AC",
  "nvge": "\u2265\u20D2",
  "nvgt": ">\u20D2",
  "nvinfin": "\u29DE",
  "nvlArr": "\u2902",
  "nvle": "\u2264\u20D2",
  "nvlt": "<\u20D2",
  "nvltrie": "\u22B4\u20D2",
  "nvrArr": "\u2903",
  "nvrtrie": "\u22B5\u20D2",
  "nvsim": "\u223C\u20D2",
  "nwArr": "\u21D6",
  "nwarhk": "\u2923",
  "nwnear": "\u2927",
  "oacute": "\xF3",
  "ocirc": "\xF4",
  "ocy": "\u043E",
  "odblac": "\u0151",
  "odiv": "\u2A38",
  "odsold": "\u29BC",
  "oelig": "\u0153",
  "ofcir": "\u29BF",
  "ofr": "\u{1D52C}",
  "ogon": "\u02DB",
  "ograve": "\xF2",
  "ogt": "\u29C1",
  "ohbar": "\u29B5",
  "olcir": "\u29BE",
  "olcross": "\u29BB",
  "olt": "\u29C0",
  "omacr": "\u014D",
  "omega": "\u03C9",
  "omicron": "\u03BF",
  "omid": "\u29B6",
  "oopf": "\u{1D560}",
  "opar": "\u29B7",
  "operp": "\u29B9",
  "or": "\u2228",
  "vee": "\u2228",
  "ord": "\u2A5D",
  "order": "\u2134",
  "orderof": "\u2134",
  "oscr": "\u2134",
  "ordf": "\xAA",
  "ordm": "\xBA",
  "origof": "\u22B6",
  "oror": "\u2A56",
  "orslope": "\u2A57",
  "orv": "\u2A5B",
  "oslash": "\xF8",
  "osol": "\u2298",
  "otilde": "\xF5",
  "otimesas": "\u2A36",
  "ouml": "\xF6",
  "ovbar": "\u233D",
  "para": "\xB6",
  "parsim": "\u2AF3",
  "parsl": "\u2AFD",
  "pcy": "\u043F",
  "percnt": "%",
  "period": ".",
  "permil": "\u2030",
  "pertenk": "\u2031",
  "pfr": "\u{1D52D}",
  "phi": "\u03C6",
  "phiv": "\u03D5",
  "straightphi": "\u03D5",
  "varphi": "\u03D5",
  "phone": "\u260E",
  "pi": "\u03C0",
  "piv": "\u03D6",
  "varpi": "\u03D6",
  "planckh": "\u210E",
  "plus": "+",
  "plusacir": "\u2A23",
  "pluscir": "\u2A22",
  "plusdu": "\u2A25",
  "pluse": "\u2A72",
  "plussim": "\u2A26",
  "plustwo": "\u2A27",
  "pointint": "\u2A15",
  "popf": "\u{1D561}",
  "pound": "\xA3",
  "prE": "\u2AB3",
  "prap": "\u2AB7",
  "precapprox": "\u2AB7",
  "precnapprox": "\u2AB9",
  "prnap": "\u2AB9",
  "precneqq": "\u2AB5",
  "prnE": "\u2AB5",
  "precnsim": "\u22E8",
  "prnsim": "\u22E8",
  "prime": "\u2032",
  "profalar": "\u232E",
  "profline": "\u2312",
  "profsurf": "\u2313",
  "prurel": "\u22B0",
  "pscr": "\u{1D4C5}",
  "psi": "\u03C8",
  "puncsp": "\u2008",
  "qfr": "\u{1D52E}",
  "qopf": "\u{1D562}",
  "qprime": "\u2057",
  "qscr": "\u{1D4C6}",
  "quatint": "\u2A16",
  "quest": "?",
  "rAtail": "\u291C",
  "rHar": "\u2964",
  "race": "\u223D\u0331",
  "racute": "\u0155",
  "raemptyv": "\u29B3",
  "rangd": "\u2992",
  "range": "\u29A5",
  "raquo": "\xBB",
  "rarrap": "\u2975",
  "rarrbfs": "\u2920",
  "rarrc": "\u2933",
  "rarrfs": "\u291E",
  "rarrpl": "\u2945",
  "rarrsim": "\u2974",
  "rarrtl": "\u21A3",
  "rightarrowtail": "\u21A3",
  "rarrw": "\u219D",
  "rightsquigarrow": "\u219D",
  "ratail": "\u291A",
  "ratio": "\u2236",
  "rbbrk": "\u2773",
  "rbrace": "}",
  "rcub": "}",
  "rbrack": "]",
  "rsqb": "]",
  "rbrke": "\u298C",
  "rbrksld": "\u298E",
  "rbrkslu": "\u2990",
  "rcaron": "\u0159",
  "rcedil": "\u0157",
  "rcy": "\u0440",
  "rdca": "\u2937",
  "rdldhar": "\u2969",
  "rdsh": "\u21B3",
  "rect": "\u25AD",
  "rfisht": "\u297D",
  "rfr": "\u{1D52F}",
  "rharul": "\u296C",
  "rho": "\u03C1",
  "rhov": "\u03F1",
  "varrho": "\u03F1",
  "rightrightarrows": "\u21C9",
  "rrarr": "\u21C9",
  "rightthreetimes": "\u22CC",
  "rthree": "\u22CC",
  "ring": "\u02DA",
  "rlm": "\u200F",
  "rmoust": "\u23B1",
  "rmoustache": "\u23B1",
  "rnmid": "\u2AEE",
  "roang": "\u27ED",
  "roarr": "\u21FE",
  "ropar": "\u2986",
  "ropf": "\u{1D563}",
  "roplus": "\u2A2E",
  "rotimes": "\u2A35",
  "rpar": ")",
  "rpargt": "\u2994",
  "rppolint": "\u2A12",
  "rsaquo": "\u203A",
  "rscr": "\u{1D4C7}",
  "rtimes": "\u22CA",
  "rtri": "\u25B9",
  "triangleright": "\u25B9",
  "rtriltri": "\u29CE",
  "ruluhar": "\u2968",
  "rx": "\u211E",
  "sacute": "\u015B",
  "scE": "\u2AB4",
  "scap": "\u2AB8",
  "succapprox": "\u2AB8",
  "scaron": "\u0161",
  "scedil": "\u015F",
  "scirc": "\u015D",
  "scnE": "\u2AB6",
  "succneqq": "\u2AB6",
  "scnap": "\u2ABA",
  "succnapprox": "\u2ABA",
  "scnsim": "\u22E9",
  "succnsim": "\u22E9",
  "scpolint": "\u2A13",
  "scy": "\u0441",
  "sdot": "\u22C5",
  "sdote": "\u2A66",
  "seArr": "\u21D8",
  "sect": "\xA7",
  "semi": ";",
  "seswar": "\u2929",
  "tosa": "\u2929",
  "sext": "\u2736",
  "sfr": "\u{1D530}",
  "sharp": "\u266F",
  "shchcy": "\u0449",
  "shcy": "\u0448",
  "shy": "\xAD",
  "sigma": "\u03C3",
  "sigmaf": "\u03C2",
  "sigmav": "\u03C2",
  "varsigma": "\u03C2",
  "simdot": "\u2A6A",
  "simg": "\u2A9E",
  "simgE": "\u2AA0",
  "siml": "\u2A9D",
  "simlE": "\u2A9F",
  "simne": "\u2246",
  "simplus": "\u2A24",
  "simrarr": "\u2972",
  "smashp": "\u2A33",
  "smeparsl": "\u29E4",
  "smile": "\u2323",
  "ssmile": "\u2323",
  "smt": "\u2AAA",
  "smte": "\u2AAC",
  "smtes": "\u2AAC\uFE00",
  "softcy": "\u044C",
  "sol": "/",
  "solb": "\u29C4",
  "solbar": "\u233F",
  "sopf": "\u{1D564}",
  "spades": "\u2660",
  "spadesuit": "\u2660",
  "sqcaps": "\u2293\uFE00",
  "sqcups": "\u2294\uFE00",
  "sscr": "\u{1D4C8}",
  "star": "\u2606",
  "sub": "\u2282",
  "subset": "\u2282",
  "subE": "\u2AC5",
  "subseteqq": "\u2AC5",
  "subdot": "\u2ABD",
  "subedot": "\u2AC3",
  "submult": "\u2AC1",
  "subnE": "\u2ACB",
  "subsetneqq": "\u2ACB",
  "subne": "\u228A",
  "subsetneq": "\u228A",
  "subplus": "\u2ABF",
  "subrarr": "\u2979",
  "subsim": "\u2AC7",
  "subsub": "\u2AD5",
  "subsup": "\u2AD3",
  "sung": "\u266A",
  "sup1": "\xB9",
  "sup2": "\xB2",
  "sup3": "\xB3",
  "supE": "\u2AC6",
  "supseteqq": "\u2AC6",
  "supdot": "\u2ABE",
  "supdsub": "\u2AD8",
  "supedot": "\u2AC4",
  "suphsol": "\u27C9",
  "suphsub": "\u2AD7",
  "suplarr": "\u297B",
  "supmult": "\u2AC2",
  "supnE": "\u2ACC",
  "supsetneqq": "\u2ACC",
  "supne": "\u228B",
  "supsetneq": "\u228B",
  "supplus": "\u2AC0",
  "supsim": "\u2AC8",
  "supsub": "\u2AD4",
  "supsup": "\u2AD6",
  "swArr": "\u21D9",
  "swnwar": "\u292A",
  "szlig": "\xDF",
  "target": "\u2316",
  "tau": "\u03C4",
  "tcaron": "\u0165",
  "tcedil": "\u0163",
  "tcy": "\u0442",
  "telrec": "\u2315",
  "tfr": "\u{1D531}",
  "theta": "\u03B8",
  "thetasym": "\u03D1",
  "thetav": "\u03D1",
  "vartheta": "\u03D1",
  "thorn": "\xFE",
  "times": "\xD7",
  "timesbar": "\u2A31",
  "timesd": "\u2A30",
  "topbot": "\u2336",
  "topcir": "\u2AF1",
  "topf": "\u{1D565}",
  "topfork": "\u2ADA",
  "tprime": "\u2034",
  "triangle": "\u25B5",
  "utri": "\u25B5",
  "triangleq": "\u225C",
  "trie": "\u225C",
  "tridot": "\u25EC",
  "triminus": "\u2A3A",
  "triplus": "\u2A39",
  "trisb": "\u29CD",
  "tritime": "\u2A3B",
  "trpezium": "\u23E2",
  "tscr": "\u{1D4C9}",
  "tscy": "\u0446",
  "tshcy": "\u045B",
  "tstrok": "\u0167",
  "uHar": "\u2963",
  "uacute": "\xFA",
  "ubrcy": "\u045E",
  "ubreve": "\u016D",
  "ucirc": "\xFB",
  "ucy": "\u0443",
  "udblac": "\u0171",
  "ufisht": "\u297E",
  "ufr": "\u{1D532}",
  "ugrave": "\xF9",
  "uhblk": "\u2580",
  "ulcorn": "\u231C",
  "ulcorner": "\u231C",
  "ulcrop": "\u230F",
  "ultri": "\u25F8",
  "umacr": "\u016B",
  "uogon": "\u0173",
  "uopf": "\u{1D566}",
  "upsi": "\u03C5",
  "upsilon": "\u03C5",
  "upuparrows": "\u21C8",
  "uuarr": "\u21C8",
  "urcorn": "\u231D",
  "urcorner": "\u231D",
  "urcrop": "\u230E",
  "uring": "\u016F",
  "urtri": "\u25F9",
  "uscr": "\u{1D4CA}",
  "utdot": "\u22F0",
  "utilde": "\u0169",
  "uuml": "\xFC",
  "uwangle": "\u29A7",
  "vBar": "\u2AE8",
  "vBarv": "\u2AE9",
  "vangrt": "\u299C",
  "varsubsetneq": "\u228A\uFE00",
  "vsubne": "\u228A\uFE00",
  "varsubsetneqq": "\u2ACB\uFE00",
  "vsubnE": "\u2ACB\uFE00",
  "varsupsetneq": "\u228B\uFE00",
  "vsupne": "\u228B\uFE00",
  "varsupsetneqq": "\u2ACC\uFE00",
  "vsupnE": "\u2ACC\uFE00",
  "vcy": "\u0432",
  "veebar": "\u22BB",
  "veeeq": "\u225A",
  "vellip": "\u22EE",
  "vfr": "\u{1D533}",
  "vopf": "\u{1D567}",
  "vscr": "\u{1D4CB}",
  "vzigzag": "\u299A",
  "wcirc": "\u0175",
  "wedbar": "\u2A5F",
  "wedgeq": "\u2259",
  "weierp": "\u2118",
  "wp": "\u2118",
  "wfr": "\u{1D534}",
  "wopf": "\u{1D568}",
  "wscr": "\u{1D4CC}",
  "xfr": "\u{1D535}",
  "xi": "\u03BE",
  "xnis": "\u22FB",
  "xopf": "\u{1D569}",
  "xscr": "\u{1D4CD}",
  "yacute": "\xFD",
  "yacy": "\u044F",
  "ycirc": "\u0177",
  "ycy": "\u044B",
  "yen": "\xA5",
  "yfr": "\u{1D536}",
  "yicy": "\u0457",
  "yopf": "\u{1D56A}",
  "yscr": "\u{1D4CE}",
  "yucy": "\u044E",
  "yuml": "\xFF",
  "zacute": "\u017A",
  "zcaron": "\u017E",
  "zcy": "\u0437",
  "zdot": "\u017C",
  "zeta": "\u03B6",
  "zfr": "\u{1D537}",
  "zhcy": "\u0436",
  "zigrarr": "\u21DD",
  "zopf": "\u{1D56B}",
  "zscr": "\u{1D4CF}",
  "zwj": "\u200D",
  "zwnj": "\u200C"
};
NAMED_ENTITIES["ngsp"] = "\uE500";

// node_modules/angular-html-parser/dist/compiler/src/ml_parser/lexer.mjs
var TokenizeResult = class {
  tokens;
  errors;
  nonNormalizedIcuExpressions;
  constructor(tokens2, errors, nonNormalizedIcuExpressions) {
    this.tokens = tokens2;
    this.errors = errors;
    this.nonNormalizedIcuExpressions = nonNormalizedIcuExpressions;
  }
};
function tokenize(source, url, getTagContentType, options = {}) {
  const tokenizer = new _Tokenizer(new ParseSourceFile(source, url), getTagContentType, options);
  tokenizer.tokenize();
  return new TokenizeResult(mergeTextTokens(tokenizer.tokens), tokenizer.errors, tokenizer.nonNormalizedIcuExpressions);
}
var _CR_OR_CRLF_REGEXP = /\r\n?/g;
function _unexpectedCharacterErrorMsg(charCode) {
  return `Unexpected character "${charCode === 0 ? "EOF" : String.fromCharCode(charCode)}"`;
}
function _unknownEntityErrorMsg(entitySrc) {
  return `Unknown entity "${entitySrc}" - use the "&#<decimal>;" or  "&#x<hex>;" syntax`;
}
function _unparsableEntityErrorMsg(type, entityStr) {
  return `Unable to parse entity "${entityStr}" - ${type} character reference entities must end with ";"`;
}
var SUPPORTED_BLOCKS = [
  "@if",
  "@else",
  "@for",
  "@switch",
  "@case",
  "@default",
  "@empty",
  "@defer",
  "@placeholder",
  "@loading",
  "@error",
  "@content"
];
var INTERPOLATION = {
  start: "{{",
  end: "}}"
};
var DEFAULT_NEVER_PATTERN = /^default[^\S\r\n]+never/;
var ELSE_IF_PATTERN = /^else[^\S\r\n]+if/;
var _Tokenizer = class {
  _getTagContentType;
  _cursor;
  _tokenizeIcu;
  _leadingTriviaCodePoints;
  _canSelfClose;
  _allowHtmComponentClosingTags;
  _allowStartTagComments;
  _currentTokenStart = null;
  _currentTokenType = null;
  _expansionCaseStack = [];
  _openDirectiveCount = 0;
  _inInterpolation = false;
  _preserveLineEndings;
  _i18nNormalizeLineEndingsInICUs;
  _fullNameStack = [];
  _tokenizeBlocks;
  _tokenizeLet;
  _selectorlessEnabled;
  tokens = [];
  errors = [];
  nonNormalizedIcuExpressions = [];
  /**
  * @param _file The html source file being tokenized.
  * @param _getTagContentType A function that will retrieve a tag content type for a given tag
  *     name.
  * @param options Configuration of the tokenization.
  */
  constructor(_file, _getTagContentType, options) {
    this._getTagContentType = _getTagContentType;
    this._tokenizeIcu = options.tokenizeExpansionForms || false;
    this._leadingTriviaCodePoints = options.leadingTriviaChars && options.leadingTriviaChars.map((c) => c.codePointAt(0) || 0);
    this._canSelfClose = options.canSelfClose || false;
    this._allowHtmComponentClosingTags = options.allowHtmComponentClosingTags || false;
    this._allowStartTagComments = options.allowStartTagComments ?? true;
    const range = options.range || {
      endPos: _file.content.length,
      startPos: 0,
      startLine: 0,
      startCol: 0
    };
    this._cursor = options.escapedString ? new EscapedCharacterCursor(_file, range) : new PlainCharacterCursor(_file, range);
    this._preserveLineEndings = options.preserveLineEndings || false;
    this._i18nNormalizeLineEndingsInICUs = options.i18nNormalizeLineEndingsInICUs || false;
    this._tokenizeBlocks = options.tokenizeBlocks ?? true;
    this._tokenizeLet = options.tokenizeLet ?? true;
    this._selectorlessEnabled = options.selectorlessEnabled ?? false;
    try {
      this._cursor.init();
    } catch (e) {
      this.handleError(e);
    }
  }
  _processCarriageReturns(content) {
    if (this._preserveLineEndings) return content;
    return content.replace(_CR_OR_CRLF_REGEXP, "\n");
  }
  tokenize() {
    while (this._cursor.peek() !== 0) {
      const start = this._cursor.clone();
      try {
        if (this._attemptCharCode(60)) if (this._attemptCharCode(33)) if (this._attemptStr("[CDATA[")) this._consumeCdata(start);
        else if (this._attemptStr("--")) this._consumeComment(start);
        else if (this._attemptStrCaseInsensitive("doctype")) this._consumeDocType(start);
        else this._consumeBogusComment(start);
        else if (this._attemptCharCode(47)) this._consumeTagClose(start);
        else {
          const savedPos = this._cursor.clone();
          if (this._attemptCharCode(63)) {
            this._cursor = savedPos;
            this._consumeBogusComment(start);
          } else this._consumeTagOpen(start);
        }
        else if (this._tokenizeLet && this._cursor.peek() === 64 && !this._inInterpolation && this._isLetStart()) this._consumeLetDeclaration(start);
        else if (this._tokenizeBlocks && this._isBlockStart()) this._consumeBlockStart(start);
        else if (this._tokenizeBlocks && !this._inInterpolation && !this._isInExpansionCase() && !this._isInExpansionForm() && this._attemptCharCode(125)) this._consumeBlockEnd(start);
        else if (!(this._tokenizeIcu && this._tokenizeExpansionForm())) this._consumeWithInterpolation(5, 8, () => this._isTextEnd(), () => this._isTagStart());
      } catch (e) {
        this.handleError(e);
      }
    }
    this._beginToken(43);
    this._endToken([]);
  }
  _getBlockName() {
    let spacesInNameAllowed = false;
    const nameCursor = this._cursor.clone();
    this._attemptCharCodeUntilFn((code2) => {
      if (isWhitespace2(code2)) return !spacesInNameAllowed;
      if (isBlockNameChar(code2)) {
        spacesInNameAllowed = true;
        return false;
      }
      return true;
    });
    let result = this._cursor.getChars(nameCursor).trim();
    if (ELSE_IF_PATTERN.test(result)) result = "else if";
    else if (DEFAULT_NEVER_PATTERN.test(result)) result = "default never";
    return result;
  }
  _consumeBlockStart(start) {
    this._requireCharCode(64);
    this._beginToken(26, start);
    const startToken = this._endToken([this._getBlockName()]);
    if (this._cursor.peek() === 40) {
      this._cursor.advance();
      this._consumeBlockParameters();
      this._attemptCharCodeUntilFn(isNotWhitespace);
      if (this._attemptCharCode(41)) this._attemptCharCodeUntilFn(isNotWhitespace);
      else {
        startToken.type = 30;
        return;
      }
    }
    if (startToken.parts[0] === "default never" && this._attemptCharCode(59)) {
      this._beginToken(27);
      this._endToken([]);
      this._beginToken(28);
      this._endToken([]);
      return;
    }
    if (this._attemptCharCode(123)) {
      this._beginToken(27);
      this._endToken([]);
    } else if (this._isBlockStart() && (startToken.parts[0] === "case" || startToken.parts[0] === "default")) {
      this._beginToken(27);
      this._endToken([]);
      this._beginToken(28);
      this._endToken([]);
    } else startToken.type = 30;
  }
  _consumeBlockEnd(start) {
    this._beginToken(28, start);
    this._endToken([]);
  }
  _consumeBlockParameters() {
    this._attemptCharCodeUntilFn(isBlockParameterChar);
    while (this._cursor.peek() !== 41 && this._cursor.peek() !== 0) {
      this._beginToken(29);
      const start = this._cursor.clone();
      let inQuote = null;
      let openParens = 0;
      while (this._cursor.peek() !== 59 && this._cursor.peek() !== 0 || inQuote !== null) {
        const char = this._cursor.peek();
        if (char === 92) this._cursor.advance();
        else if (char === inQuote) inQuote = null;
        else if (inQuote === null && isQuote(char)) inQuote = char;
        else if (char === 40 && inQuote === null) openParens++;
        else if (char === 41 && inQuote === null) {
          if (openParens === 0) break;
          else if (openParens > 0) openParens--;
        }
        this._cursor.advance();
      }
      this._endToken([this._cursor.getChars(start)]);
      this._attemptCharCodeUntilFn(isBlockParameterChar);
    }
  }
  _consumeLetDeclaration(start) {
    this._requireStr("@let");
    this._beginToken(31, start);
    if (isWhitespace2(this._cursor.peek())) this._attemptCharCodeUntilFn(isNotWhitespace);
    else {
      const token = this._endToken([this._cursor.getChars(start)]);
      token.type = 34;
      return;
    }
    const startToken = this._endToken([this._getLetDeclarationName()]);
    this._attemptCharCodeUntilFn(isNotWhitespace);
    if (!this._attemptCharCode(61)) {
      startToken.type = 34;
      return;
    }
    this._attemptCharCodeUntilFn((code2) => isNotWhitespace(code2) && !isNewLine2(code2));
    this._consumeLetDeclarationValue();
    if (this._cursor.peek() === 59) {
      this._beginToken(33);
      this._cursor.advance();
      this._endToken([]);
    } else {
      startToken.type = 34;
      startToken.sourceSpan = this._cursor.getSpan(start);
    }
  }
  _getLetDeclarationName() {
    const nameCursor = this._cursor.clone();
    let allowDigit = false;
    this._attemptCharCodeUntilFn((code2) => {
      if (isAsciiLetter(code2) || code2 === 36 || code2 === 95 || allowDigit && isDigit2(code2)) {
        allowDigit = true;
        return false;
      }
      return true;
    });
    return this._cursor.getChars(nameCursor).trim();
  }
  _consumeLetDeclarationValue() {
    const start = this._cursor.clone();
    this._beginToken(32, start);
    while (this._cursor.peek() !== 0) {
      const char = this._cursor.peek();
      if (char === 59) break;
      if (isQuote(char)) {
        this._cursor.advance();
        this._attemptCharCodeUntilFn((inner) => {
          if (inner === 92) {
            this._cursor.advance();
            return false;
          }
          return inner === char;
        });
      }
      this._cursor.advance();
    }
    this._endToken([this._cursor.getChars(start)]);
  }
  /**
  * @returns whether an ICU token has been created
  * @internal
  */
  _tokenizeExpansionForm() {
    if (this.isExpansionFormStart()) {
      this._consumeExpansionFormStart();
      return true;
    }
    if (isExpansionCaseStart(this._cursor.peek()) && this._isInExpansionForm()) {
      this._consumeExpansionCaseStart();
      return true;
    }
    if (this._cursor.peek() === 125) {
      if (this._isInExpansionCase()) {
        this._consumeExpansionCaseEnd();
        return true;
      }
      if (this._isInExpansionForm()) {
        this._consumeExpansionFormEnd();
        return true;
      }
    }
    return false;
  }
  _beginToken(type, start = this._cursor.clone()) {
    this._currentTokenStart = start;
    this._currentTokenType = type;
  }
  _endToken(parts, end) {
    if (this._currentTokenStart === null) throw new ParseError(this._cursor.getSpan(end), "Programming error - attempted to end a token when there was no start to the token");
    if (this._currentTokenType === null) throw new ParseError(this._cursor.getSpan(this._currentTokenStart), "Programming error - attempted to end a token which has no token type");
    const token = {
      type: this._currentTokenType,
      parts,
      sourceSpan: (end ?? this._cursor).getSpan(this._currentTokenStart, this._leadingTriviaCodePoints)
    };
    this.tokens.push(token);
    this._currentTokenStart = null;
    this._currentTokenType = null;
    return token;
  }
  _createError(msg, span) {
    if (this._isInExpansionForm()) msg += ` (Do you have an unescaped "{" in your template? Use "{{ '{' }}") to escape it.)`;
    const error = new ParseError(span, msg);
    this._currentTokenStart = null;
    this._currentTokenType = null;
    return error;
  }
  handleError(e) {
    if (e instanceof CursorError) e = this._createError(e.msg, this._cursor.getSpan(e.cursor));
    if (e instanceof ParseError) this.errors.push(e);
    else throw e;
  }
  _attemptCharCode(charCode) {
    if (this._cursor.peek() === charCode) {
      this._cursor.advance();
      return true;
    }
    return false;
  }
  _attemptCharCodeCaseInsensitive(charCode) {
    if (compareCharCodeCaseInsensitive(this._cursor.peek(), charCode)) {
      this._cursor.advance();
      return true;
    }
    return false;
  }
  _requireCharCode(charCode) {
    const location = this._cursor.clone();
    if (!this._attemptCharCode(charCode)) throw this._createError(_unexpectedCharacterErrorMsg(this._cursor.peek()), this._cursor.getSpan(location));
  }
  _attemptStr(chars) {
    const len = chars.length;
    if (this._cursor.charsLeft() < len) return false;
    const initialPosition = this._cursor.clone();
    for (let i = 0; i < len; i++) if (!this._attemptCharCode(chars.charCodeAt(i))) {
      this._cursor = initialPosition;
      return false;
    }
    return true;
  }
  _attemptStrCaseInsensitive(chars) {
    for (let i = 0; i < chars.length; i++) if (!this._attemptCharCodeCaseInsensitive(chars.charCodeAt(i))) return false;
    return true;
  }
  _requireStr(chars) {
    const location = this._cursor.clone();
    if (!this._attemptStr(chars)) throw this._createError(_unexpectedCharacterErrorMsg(this._cursor.peek()), this._cursor.getSpan(location));
  }
  _requireStrCaseInsensitive(chars) {
    const location = this._cursor.clone();
    if (!this._attemptStrCaseInsensitive(chars)) throw this._createError(_unexpectedCharacterErrorMsg(this._cursor.peek()), this._cursor.getSpan(location));
  }
  _attemptCharCodeUntilFn(predicate) {
    while (!predicate(this._cursor.peek())) this._cursor.advance();
  }
  _requireCharCodeUntilFn(predicate, len) {
    const start = this._cursor.clone();
    this._attemptCharCodeUntilFn(predicate);
    if (this._cursor.diff(start) < len) throw this._createError(_unexpectedCharacterErrorMsg(this._cursor.peek()), this._cursor.getSpan(start));
  }
  _attemptUntilChar(char) {
    while (this._cursor.peek() !== char) this._cursor.advance();
  }
  _readChar() {
    const char = String.fromCodePoint(this._cursor.peek());
    this._cursor.advance();
    return char;
  }
  _peekStr(chars) {
    const len = chars.length;
    if (this._cursor.charsLeft() < len) return false;
    const cursor = this._cursor.clone();
    for (let i = 0; i < len; i++) {
      if (cursor.peek() !== chars.charCodeAt(i)) return false;
      cursor.advance();
    }
    return true;
  }
  _isBlockStart() {
    return this._cursor.peek() === 64 && SUPPORTED_BLOCKS.some((blockName) => this._peekStr(blockName));
  }
  _isLetStart() {
    return this._cursor.peek() === 64 && this._peekStr("@let");
  }
  _consumeEntity(textTokenType) {
    this._beginToken(9);
    const start = this._cursor.clone();
    this._cursor.advance();
    if (this._attemptCharCode(35)) {
      const isHex = this._attemptCharCode(120) || this._attemptCharCode(88);
      const codeStart = this._cursor.clone();
      this._attemptCharCodeUntilFn(isDigitEntityEnd);
      if (this._cursor.peek() != 59) {
        this._cursor.advance();
        const entityType = isHex ? "hexadecimal" : "decimal";
        throw this._createError(_unparsableEntityErrorMsg(entityType, this._cursor.getChars(start)), this._cursor.getSpan());
      }
      const strNum = this._cursor.getChars(codeStart);
      this._cursor.advance();
      try {
        const charCode = parseInt(strNum, isHex ? 16 : 10);
        this._endToken([String.fromCodePoint(charCode), this._cursor.getChars(start)]);
      } catch {
        throw this._createError(_unknownEntityErrorMsg(this._cursor.getChars(start)), this._cursor.getSpan());
      }
    } else {
      const nameStart = this._cursor.clone();
      this._attemptCharCodeUntilFn(isNamedEntityEnd);
      if (this._cursor.peek() != 59) {
        this._beginToken(textTokenType, start);
        this._cursor = nameStart;
        this._endToken(["&"]);
      } else {
        const name = this._cursor.getChars(nameStart);
        this._cursor.advance();
        const char = NAMED_ENTITIES.hasOwnProperty(name) && NAMED_ENTITIES[name];
        if (!char) throw this._createError(_unknownEntityErrorMsg(name), this._cursor.getSpan(start));
        this._endToken([char, `&${name};`]);
      }
    }
  }
  _consumeRawText(consumeEntities, endMarkerPredicate) {
    this._beginToken(consumeEntities ? 6 : 7);
    const parts = [];
    while (true) {
      const tagCloseStart = this._cursor.clone();
      const foundEndMarker = endMarkerPredicate();
      this._cursor = tagCloseStart;
      if (foundEndMarker) break;
      if (consumeEntities && this._cursor.peek() === 38) {
        this._endToken([this._processCarriageReturns(parts.join(""))]);
        parts.length = 0;
        this._consumeEntity(6);
        this._beginToken(6);
      } else parts.push(this._readChar());
    }
    this._endToken([this._processCarriageReturns(parts.join(""))]);
  }
  _consumeComment(start) {
    this._beginToken(10, start);
    this._endToken([]);
    this._consumeRawText(false, () => this._attemptStr("-->"));
    this._beginToken(11);
    this._requireStr("-->");
    this._endToken([]);
  }
  _consumeBogusComment(start) {
    this._beginToken(10, start);
    this._endToken([]);
    this._consumeRawText(false, () => this._cursor.peek() === 62);
    this._beginToken(11);
    this._cursor.advance();
    this._endToken([]);
  }
  _consumeCdata(start) {
    this._beginToken(13, start);
    this._endToken([]);
    this._consumeRawText(false, () => this._attemptStr("]]>"));
    this._beginToken(14);
    this._requireStr("]]>");
    this._endToken([]);
  }
  _consumeDocType(start) {
    this._beginToken(19, start);
    this._endToken([]);
    this._consumeRawText(false, () => this._cursor.peek() === 62);
    this._beginToken(20);
    this._cursor.advance();
    this._endToken([]);
  }
  _consumePrefixAndName(endPredicate) {
    const nameOrPrefixStart = this._cursor.clone();
    let prefix2 = "";
    while (this._cursor.peek() !== 58 && !isPrefixEnd(this._cursor.peek())) this._cursor.advance();
    let nameStart;
    if (this._cursor.peek() === 58) {
      prefix2 = this._cursor.getChars(nameOrPrefixStart);
      this._cursor.advance();
      nameStart = this._cursor.clone();
    } else nameStart = nameOrPrefixStart;
    this._requireCharCodeUntilFn(endPredicate, prefix2 === "" ? 0 : 1);
    const name = this._cursor.getChars(nameStart);
    return [prefix2, name];
  }
  _consumeSingleLineComment(start) {
    const contentStart = this._cursor.clone();
    this._attemptCharCodeUntilFn((code2) => isNewLine2(code2) || code2 === 0);
    const spanEnd = this._cursor.clone();
    const content = spanEnd.getChars(contentStart);
    this._beginToken(12, start);
    this._endToken([content, "single"], spanEnd);
    this._attemptCharCodeUntilFn(isNotWhitespace);
  }
  _consumeMultiLineComment(start) {
    const contentStart = this._cursor.clone();
    this._attemptCharCodeUntilFn((code2) => {
      if (code2 === 0) return true;
      if (code2 === 42) {
        const next = this._cursor.clone();
        next.advance();
        return next.peek() === 47;
      }
      return false;
    });
    const contentEnd = this._cursor.clone();
    const content = contentEnd.getChars(contentStart);
    let spanEnd = contentEnd;
    if (this._attemptStr("*/")) {
      spanEnd = this._cursor.clone();
      this._attemptCharCodeUntilFn(isNotWhitespace);
    }
    this._beginToken(12, start);
    this._endToken([content, "multi"], spanEnd);
  }
  _consumeTagOpen(start) {
    let tagName;
    let prefix2;
    let closingTagName;
    let openToken;
    const attrs = [];
    try {
      if (this._selectorlessEnabled && isSelectorlessNameStart(this._cursor.peek())) {
        openToken = this._consumeComponentOpenStart(start);
        [closingTagName, prefix2, tagName] = openToken.parts;
        if (prefix2) closingTagName += `:${prefix2}`;
        if (tagName) closingTagName += `:${tagName}`;
        this._attemptCharCodeUntilFn(isNotWhitespace);
      } else {
        if (!isAsciiLetter(this._cursor.peek())) throw this._createError(_unexpectedCharacterErrorMsg(this._cursor.peek()), this._cursor.getSpan(start));
        openToken = this._consumeTagOpenStart(start);
        prefix2 = openToken.parts[0];
        tagName = closingTagName = openToken.parts[1];
        this._attemptCharCodeUntilFn(isNotWhitespace);
      }
      while (true) {
        if (this._allowStartTagComments) {
          const commentStart = this._cursor.clone();
          if (this._attemptStr("//")) {
            this._consumeSingleLineComment(commentStart);
            continue;
          }
          if (this._attemptStr("/*")) {
            this._consumeMultiLineComment(commentStart);
            continue;
          }
        }
        if (isAttributeTerminator(this._cursor.peek())) break;
        if (this._selectorlessEnabled && this._cursor.peek() === 64) {
          const start2 = this._cursor.clone();
          const nameStart = start2.clone();
          nameStart.advance();
          if (isSelectorlessNameStart(nameStart.peek())) this._consumeDirective(start2, nameStart);
        } else {
          const attr = this._consumeAttribute();
          attrs.push(attr);
        }
      }
      if (openToken.type === 35) this._consumeComponentOpenEnd();
      else this._consumeTagOpenEnd();
    } catch (e) {
      if (e instanceof ParseError) {
        if (openToken) openToken.type = openToken.type === 35 ? 39 : 4;
        else {
          this._beginToken(5, start);
          this._endToken(["<"]);
        }
        return;
      }
      throw e;
    }
    if (this._canSelfClose && this.tokens[this.tokens.length - 1].type === 2) return;
    const contentTokenType = this._getTagContentType(tagName, prefix2, this._fullNameStack.length > 0, attrs);
    this._handleFullNameStackForTagOpen(prefix2, tagName);
    if (contentTokenType === 0) this._consumeRawTextWithTagClose(prefix2, openToken, closingTagName, false);
    else if (contentTokenType === 1) this._consumeRawTextWithTagClose(prefix2, openToken, closingTagName, true);
  }
  _consumeRawTextWithTagClose(prefix2, openToken, tagName, consumeEntities) {
    this._consumeRawText(consumeEntities, () => {
      if (!this._attemptCharCode(60)) return false;
      if (!this._attemptCharCode(47)) return false;
      this._attemptCharCodeUntilFn(isNotWhitespace);
      if (!this._attemptStrCaseInsensitive(prefix2 && openToken.type !== 35 ? `${prefix2}:${tagName}` : tagName)) return false;
      this._attemptCharCodeUntilFn(isNotWhitespace);
      return this._attemptCharCode(62);
    });
    this._beginToken(openToken.type === 35 ? 38 : 3);
    this._requireCharCodeUntilFn((code2) => code2 === 62, 3);
    this._cursor.advance();
    this._endToken(openToken.parts);
    this._handleFullNameStackForTagClose(prefix2, tagName);
  }
  _consumeTagOpenStart(start) {
    this._beginToken(0, start);
    const parts = this._consumePrefixAndName(isNameEnd);
    return this._endToken(parts);
  }
  _consumeComponentOpenStart(start) {
    this._beginToken(35, start);
    const parts = this._consumeComponentName();
    return this._endToken(parts);
  }
  _consumeComponentName() {
    const nameStart = this._cursor.clone();
    while (isSelectorlessNameChar(this._cursor.peek())) this._cursor.advance();
    const name = this._cursor.getChars(nameStart);
    let prefix2 = "";
    let tagName = "";
    if (this._cursor.peek() === 58) {
      this._cursor.advance();
      [prefix2, tagName] = this._consumePrefixAndName(isNameEnd);
    }
    return [
      name,
      prefix2,
      tagName
    ];
  }
  _consumeAttribute() {
    const [prefix2, name] = this._consumeAttributeName();
    let value;
    this._attemptCharCodeUntilFn(isNotWhitespace);
    if (this._attemptCharCode(61)) {
      this._attemptCharCodeUntilFn(isNotWhitespace);
      value = this._consumeAttributeValue();
    }
    this._attemptCharCodeUntilFn(isNotWhitespace);
    return {
      prefix: prefix2,
      name,
      value
    };
  }
  _consumeAttributeName() {
    const attrNameStart = this._cursor.peek();
    if (attrNameStart === 39 || attrNameStart === 34) throw this._createError(_unexpectedCharacterErrorMsg(attrNameStart), this._cursor.getSpan());
    this._beginToken(15);
    let nameEndPredicate;
    if (this._openDirectiveCount > 0) {
      let openParens = 0;
      nameEndPredicate = (code2) => {
        if (this._openDirectiveCount > 0) {
          if (code2 === 40) openParens++;
          else if (code2 === 41) {
            if (openParens === 0) return true;
            openParens--;
          }
        }
        return isNameEnd(code2);
      };
    } else if (attrNameStart === 91) {
      let openBrackets = 0;
      nameEndPredicate = (code2) => {
        if (code2 === 91) openBrackets++;
        else if (code2 === 93) openBrackets--;
        return openBrackets <= 0 ? isNameEnd(code2) : isNewLine2(code2);
      };
    } else nameEndPredicate = isNameEnd;
    const prefixAndName = this._consumePrefixAndName(nameEndPredicate);
    this._endToken(prefixAndName);
    return prefixAndName;
  }
  _consumeAttributeValue() {
    let value;
    if (this._cursor.peek() === 39 || this._cursor.peek() === 34) {
      const quoteChar = this._cursor.peek();
      this._consumeQuote(quoteChar);
      const endPredicate = () => this._cursor.peek() === quoteChar;
      value = this._consumeWithInterpolation(17, 18, endPredicate, endPredicate);
      this._consumeQuote(quoteChar);
    } else {
      const endPredicate = () => isNameEnd(this._cursor.peek());
      value = this._consumeWithInterpolation(17, 18, endPredicate, endPredicate);
    }
    return value;
  }
  _consumeQuote(quoteChar) {
    this._beginToken(16);
    this._requireCharCode(quoteChar);
    this._endToken([String.fromCodePoint(quoteChar)]);
  }
  _consumeTagOpenEnd() {
    const tokenType = this._attemptCharCode(47) ? 2 : 1;
    this._beginToken(tokenType);
    this._requireCharCode(62);
    this._endToken([]);
  }
  _consumeComponentOpenEnd() {
    const tokenType = this._attemptCharCode(47) ? 37 : 36;
    this._beginToken(tokenType);
    this._requireCharCode(62);
    this._endToken([]);
  }
  _consumeTagClose(start) {
    if (this._selectorlessEnabled) {
      const clone = start.clone();
      while (clone.peek() !== 62 && !isSelectorlessNameStart(clone.peek())) clone.advance();
      if (isSelectorlessNameStart(clone.peek())) {
        this._beginToken(38, start);
        const parts = this._consumeComponentName();
        this._attemptCharCodeUntilFn(isNotWhitespace);
        this._requireCharCode(62);
        this._endToken(parts);
        return;
      }
    }
    this._beginToken(3, start);
    this._attemptCharCodeUntilFn(isNotWhitespace);
    if (this._allowHtmComponentClosingTags && this._attemptCharCode(47)) {
      this._attemptCharCodeUntilFn(isNotWhitespace);
      this._requireCharCode(62);
      this._endToken([]);
    } else {
      const [prefix2, name] = this._consumePrefixAndName(isNameEnd);
      this._attemptCharCodeUntilFn(isNotWhitespace);
      this._requireCharCode(62);
      this._endToken([prefix2, name]);
      this._handleFullNameStackForTagClose(prefix2, name);
    }
  }
  _consumeExpansionFormStart() {
    this._beginToken(21);
    this._requireCharCode(123);
    this._endToken([]);
    this._expansionCaseStack.push(21);
    this._beginToken(7);
    const condition = this._readUntil(44);
    const normalizedCondition = this._processCarriageReturns(condition);
    if (this._i18nNormalizeLineEndingsInICUs) this._endToken([normalizedCondition]);
    else {
      const conditionToken = this._endToken([condition]);
      if (normalizedCondition !== condition) this.nonNormalizedIcuExpressions.push(conditionToken);
    }
    this._requireCharCode(44);
    this._attemptCharCodeUntilFn(isNotWhitespace);
    this._beginToken(7);
    const type = this._readUntil(44);
    this._endToken([type]);
    this._requireCharCode(44);
    this._attemptCharCodeUntilFn(isNotWhitespace);
  }
  _consumeExpansionCaseStart() {
    this._beginToken(22);
    const value = this._readUntil(123).trim();
    this._endToken([value]);
    this._attemptCharCodeUntilFn(isNotWhitespace);
    this._beginToken(23);
    this._requireCharCode(123);
    this._endToken([]);
    this._attemptCharCodeUntilFn(isNotWhitespace);
    this._expansionCaseStack.push(23);
  }
  _consumeExpansionCaseEnd() {
    this._beginToken(24);
    this._requireCharCode(125);
    this._endToken([]);
    this._attemptCharCodeUntilFn(isNotWhitespace);
    this._expansionCaseStack.pop();
  }
  _consumeExpansionFormEnd() {
    this._beginToken(25);
    this._requireCharCode(125);
    this._endToken([]);
    this._expansionCaseStack.pop();
  }
  /**
  * Consume a string that may contain interpolation expressions.
  *
  * The first token consumed will be of `tokenType` and then there will be alternating
  * `interpolationTokenType` and `tokenType` tokens until the `endPredicate()` returns true.
  *
  * If an interpolation token ends prematurely it will have no end marker in its `parts` array.
  *
  * @param textTokenType the kind of tokens to interleave around interpolation tokens.
  * @param interpolationTokenType the kind of tokens that contain interpolation.
  * @param endPredicate a function that should return true when we should stop consuming.
  * @param endInterpolation a function that should return true if there is a premature end to an
  *     interpolation expression - i.e. before we get to the normal interpolation closing marker.
  */
  _consumeWithInterpolation(textTokenType, interpolationTokenType, endPredicate, endInterpolation) {
    this._beginToken(textTokenType);
    const parts = [];
    while (!endPredicate()) {
      const current = this._cursor.clone();
      if (this._attemptStr(INTERPOLATION.start)) {
        this._endToken([this._processCarriageReturns(parts.join(""))], current);
        parts.length = 0;
        this._consumeInterpolation(interpolationTokenType, current, endInterpolation);
        this._beginToken(textTokenType);
      } else if (this._cursor.peek() === 38) {
        this._endToken([this._processCarriageReturns(parts.join(""))]);
        parts.length = 0;
        this._consumeEntity(textTokenType);
        this._beginToken(textTokenType);
      } else parts.push(this._readChar());
    }
    this._inInterpolation = false;
    const value = this._processCarriageReturns(parts.join(""));
    this._endToken([value]);
    return value;
  }
  /**
  * Consume a block of text that has been interpreted as an Angular interpolation.
  *
  * @param interpolationTokenType the type of the interpolation token to generate.
  * @param interpolationStart a cursor that points to the start of this interpolation.
  * @param prematureEndPredicate a function that should return true if the next characters indicate
  *     an end to the interpolation before its normal closing marker.
  */
  _consumeInterpolation(interpolationTokenType, interpolationStart, prematureEndPredicate) {
    const parts = [];
    this._beginToken(interpolationTokenType, interpolationStart);
    parts.push(INTERPOLATION.start);
    const expressionStart = this._cursor.clone();
    let inQuote = null;
    let inComment = false;
    while (this._cursor.peek() !== 0 && (prematureEndPredicate === null || !prematureEndPredicate())) {
      const current = this._cursor.clone();
      if (this._isTagStart()) {
        this._cursor = current;
        parts.push(this._getProcessedChars(expressionStart, current));
        this._endToken(parts);
        return;
      }
      if (inQuote === null) {
        if (this._attemptStr(INTERPOLATION.end)) {
          parts.push(this._getProcessedChars(expressionStart, current));
          parts.push(INTERPOLATION.end);
          this._endToken(parts);
          return;
        } else if (this._attemptStr("//")) inComment = true;
      }
      const char = this._cursor.peek();
      this._cursor.advance();
      if (char === 92) this._cursor.advance();
      else if (char === inQuote) inQuote = null;
      else if (!inComment && inQuote === null && isQuote(char)) inQuote = char;
    }
    parts.push(this._getProcessedChars(expressionStart, this._cursor));
    this._endToken(parts);
  }
  _consumeDirective(start, nameStart) {
    this._requireCharCode(64);
    this._cursor.advance();
    while (isSelectorlessNameChar(this._cursor.peek())) this._cursor.advance();
    this._beginToken(40, start);
    const name = this._cursor.getChars(nameStart);
    this._endToken([name]);
    this._attemptCharCodeUntilFn(isNotWhitespace);
    if (this._cursor.peek() !== 40) return;
    this._openDirectiveCount++;
    this._beginToken(41);
    this._cursor.advance();
    this._endToken([]);
    this._attemptCharCodeUntilFn(isNotWhitespace);
    while (!isAttributeTerminator(this._cursor.peek()) && this._cursor.peek() !== 41) this._consumeAttribute();
    this._attemptCharCodeUntilFn(isNotWhitespace);
    this._openDirectiveCount--;
    if (this._cursor.peek() !== 41) {
      if (this._cursor.peek() === 62 || this._cursor.peek() === 47) return;
      throw this._createError(_unexpectedCharacterErrorMsg(this._cursor.peek()), this._cursor.getSpan(start));
    }
    this._beginToken(42);
    this._cursor.advance();
    this._endToken([]);
    this._attemptCharCodeUntilFn(isNotWhitespace);
  }
  _getProcessedChars(start, end) {
    return this._processCarriageReturns(end.getChars(start));
  }
  _isTextEnd() {
    if (this._isTagStart() || this._cursor.peek() === 0) return true;
    if (this._tokenizeIcu && !this._inInterpolation) {
      if (this.isExpansionFormStart()) return true;
      if (this._cursor.peek() === 125 && this._isInExpansionCase()) return true;
    }
    if (this._tokenizeBlocks && !this._inInterpolation && !this._isInExpansion() && (this._isBlockStart() || this._isLetStart() || this._cursor.peek() === 125)) return true;
    return false;
  }
  /**
  * Returns true if the current cursor is pointing to the start of a tag
  * (opening/closing/comments/cdata/etc).
  */
  _isTagStart() {
    if (this._cursor.peek() === 60) {
      const tmp = this._cursor.clone();
      tmp.advance();
      const code2 = tmp.peek();
      if (97 <= code2 && code2 <= 122 || 65 <= code2 && code2 <= 90 || code2 === 47 || code2 === 33) return true;
    }
    return false;
  }
  _readUntil(char) {
    const start = this._cursor.clone();
    this._attemptUntilChar(char);
    return this._cursor.getChars(start);
  }
  _isInExpansion() {
    return this._isInExpansionCase() || this._isInExpansionForm();
  }
  _isInExpansionCase() {
    return this._expansionCaseStack.length > 0 && this._expansionCaseStack[this._expansionCaseStack.length - 1] === 23;
  }
  _isInExpansionForm() {
    return this._expansionCaseStack.length > 0 && this._expansionCaseStack[this._expansionCaseStack.length - 1] === 21;
  }
  isExpansionFormStart() {
    if (this._cursor.peek() !== 123) return false;
    const start = this._cursor.clone();
    const isInterpolation = this._attemptStr(INTERPOLATION.start);
    this._cursor = start;
    return !isInterpolation;
  }
  _handleFullNameStackForTagOpen(prefix2, tagName) {
    const fullName = mergeNsAndName(prefix2, tagName);
    if (this._fullNameStack.length === 0 || this._fullNameStack[this._fullNameStack.length - 1] === fullName) this._fullNameStack.push(fullName);
  }
  _handleFullNameStackForTagClose(prefix2, tagName) {
    const fullName = mergeNsAndName(prefix2, tagName);
    if (this._fullNameStack.length !== 0 && this._fullNameStack[this._fullNameStack.length - 1] === fullName) this._fullNameStack.pop();
  }
};
function isNotWhitespace(code2) {
  return !isWhitespace2(code2) || code2 === 0;
}
function isNameEnd(code2) {
  return isWhitespace2(code2) || code2 === 62 || code2 === 60 || code2 === 47 || code2 === 39 || code2 === 34 || code2 === 61 || code2 === 0;
}
function isPrefixEnd(code2) {
  return (code2 < 97 || 122 < code2) && (code2 < 65 || 90 < code2) && (code2 < 48 || code2 > 57);
}
function isDigitEntityEnd(code2) {
  return code2 === 59 || code2 === 0 || !isAsciiHexDigit(code2);
}
function isNamedEntityEnd(code2) {
  return code2 === 59 || code2 === 0 || !(isAsciiLetter(code2) || isDigit2(code2));
}
function isExpansionCaseStart(peek) {
  return peek !== 125;
}
function compareCharCodeCaseInsensitive(code1, code2) {
  return toUpperCaseCharCode(code1) === toUpperCaseCharCode(code2);
}
function toUpperCaseCharCode(code2) {
  return code2 >= 97 && code2 <= 122 ? code2 - 97 + 65 : code2;
}
function isBlockNameChar(code2) {
  return isAsciiLetter(code2) || isDigit2(code2) || code2 === 95;
}
function isBlockParameterChar(code2) {
  return code2 !== 59 && isNotWhitespace(code2);
}
function isSelectorlessNameStart(code2) {
  return code2 === 95 || code2 >= 65 && code2 <= 90;
}
function isSelectorlessNameChar(code2) {
  return isAsciiLetter(code2) || isDigit2(code2) || code2 === 95;
}
function isAttributeTerminator(code2) {
  return code2 === 47 || code2 === 62 || code2 === 60 || code2 === 0;
}
function mergeTextTokens(srcTokens) {
  const dstTokens = [];
  let lastDstToken = void 0;
  for (let i = 0; i < srcTokens.length; i++) {
    const token = srcTokens[i];
    if (lastDstToken && lastDstToken.type === 5 && token.type === 5 || lastDstToken && lastDstToken.type === 17 && token.type === 17) {
      lastDstToken.parts[0] += token.parts[0];
      lastDstToken.sourceSpan.end = token.sourceSpan.end;
    } else {
      lastDstToken = token;
      dstTokens.push(lastDstToken);
    }
  }
  return dstTokens;
}
var PlainCharacterCursor = class PlainCharacterCursor2 {
  state;
  file;
  input;
  end;
  constructor(fileOrCursor, range) {
    if (fileOrCursor instanceof PlainCharacterCursor2) {
      this.file = fileOrCursor.file;
      this.input = fileOrCursor.input;
      this.end = fileOrCursor.end;
      const state = fileOrCursor.state;
      this.state = {
        peek: state.peek,
        offset: state.offset,
        line: state.line,
        column: state.column
      };
    } else {
      if (!range) throw new Error("Programming error: the range argument must be provided with a file argument.");
      this.file = fileOrCursor;
      this.input = fileOrCursor.content;
      this.end = range.endPos;
      this.state = {
        peek: -1,
        offset: range.startPos,
        line: range.startLine,
        column: range.startCol
      };
    }
  }
  clone() {
    return new PlainCharacterCursor2(this);
  }
  peek() {
    return this.state.peek;
  }
  charsLeft() {
    return this.end - this.state.offset;
  }
  diff(other) {
    return this.state.offset - other.state.offset;
  }
  advance() {
    this.advanceState(this.state);
  }
  init() {
    this.updatePeek(this.state);
  }
  getSpan(start, leadingTriviaCodePoints) {
    start = start || this;
    let fullStart = start;
    if (leadingTriviaCodePoints) while (this.diff(start) > 0 && leadingTriviaCodePoints.indexOf(start.peek()) !== -1) {
      if (fullStart === start) start = start.clone();
      start.advance();
    }
    const startLocation = this.locationFromCursor(start);
    return new ParseSourceSpan(startLocation, this.locationFromCursor(this), fullStart !== start ? this.locationFromCursor(fullStart) : startLocation);
  }
  getChars(start) {
    return this.input.substring(start.state.offset, this.state.offset);
  }
  charAt(pos) {
    return this.input.charCodeAt(pos);
  }
  advanceState(state) {
    if (state.offset >= this.end) {
      this.state = state;
      throw new CursorError('Unexpected character "EOF"', this);
    }
    const currentChar = this.charAt(state.offset);
    if (currentChar === 10) {
      state.line++;
      state.column = 0;
    } else if (!isNewLine2(currentChar)) state.column++;
    state.offset++;
    this.updatePeek(state);
  }
  updatePeek(state) {
    state.peek = state.offset >= this.end ? 0 : this.charAt(state.offset);
  }
  locationFromCursor(cursor) {
    return new ParseLocation(cursor.file, cursor.state.offset, cursor.state.line, cursor.state.column);
  }
};
var EscapedCharacterCursor = class EscapedCharacterCursor2 extends PlainCharacterCursor {
  internalState;
  constructor(fileOrCursor, range) {
    if (fileOrCursor instanceof EscapedCharacterCursor2) {
      super(fileOrCursor);
      this.internalState = { ...fileOrCursor.internalState };
    } else {
      super(fileOrCursor, range);
      this.internalState = this.state;
    }
  }
  advance() {
    this.state = this.internalState;
    super.advance();
    this.processEscapeSequence();
  }
  init() {
    super.init();
    this.processEscapeSequence();
  }
  clone() {
    return new EscapedCharacterCursor2(this);
  }
  getChars(start) {
    const cursor = start.clone();
    let chars = "";
    while (cursor.internalState.offset < this.internalState.offset) {
      chars += String.fromCodePoint(cursor.peek());
      cursor.advance();
    }
    return chars;
  }
  /**
  * Process the escape sequence that starts at the current position in the text.
  *
  * This method is called to ensure that `peek` has the unescaped value of escape sequences.
  */
  processEscapeSequence() {
    const peek = () => this.internalState.peek;
    if (peek() === 92) {
      this.internalState = { ...this.state };
      this.advanceState(this.internalState);
      if (peek() === 110) this.state.peek = 10;
      else if (peek() === 114) this.state.peek = 13;
      else if (peek() === 118) this.state.peek = 11;
      else if (peek() === 116) this.state.peek = 9;
      else if (peek() === 98) this.state.peek = 8;
      else if (peek() === 102) this.state.peek = 12;
      else if (peek() === 117) {
        this.advanceState(this.internalState);
        if (peek() === 123) {
          this.advanceState(this.internalState);
          const digitStart = this.clone();
          let length = 0;
          while (peek() !== 125) {
            this.advanceState(this.internalState);
            length++;
          }
          this.state.peek = this.decodeHexDigits(digitStart, length);
        } else {
          const digitStart = this.clone();
          this.advanceState(this.internalState);
          this.advanceState(this.internalState);
          this.advanceState(this.internalState);
          this.state.peek = this.decodeHexDigits(digitStart, 4);
        }
      } else if (peek() === 120) {
        this.advanceState(this.internalState);
        const digitStart = this.clone();
        this.advanceState(this.internalState);
        this.state.peek = this.decodeHexDigits(digitStart, 2);
      } else if (isOctalDigit(peek())) {
        let octal = "";
        let length = 0;
        let previous = this.clone();
        while (isOctalDigit(peek()) && length < 3) {
          previous = this.clone();
          octal += String.fromCodePoint(peek());
          this.advanceState(this.internalState);
          length++;
        }
        this.state.peek = parseInt(octal, 8);
        this.internalState = previous.internalState;
      } else if (isNewLine2(this.internalState.peek)) {
        this.advanceState(this.internalState);
        this.state = this.internalState;
      } else this.state.peek = this.internalState.peek;
    }
  }
  decodeHexDigits(start, length) {
    const hex = this.input.slice(start.internalState.offset, start.internalState.offset + length);
    const charCode = parseInt(hex, 16);
    if (!isNaN(charCode)) return charCode;
    else {
      start.state = start.internalState;
      throw new CursorError("Invalid hexadecimal escape sequence", start);
    }
  }
};
var CursorError = class extends Error {
  msg;
  cursor;
  constructor(msg, cursor) {
    super(msg);
    this.msg = msg;
    this.cursor = cursor;
    Object.setPrototypeOf(this, new.target.prototype);
  }
};

// node_modules/angular-html-parser/dist/compiler/src/ml_parser/parser.mjs
var TreeError = class TreeError2 extends ParseError {
  elementName;
  static create(elementName2, span, msg) {
    return new TreeError2(elementName2, span, msg);
  }
  constructor(elementName2, span, msg) {
    super(span, msg);
    this.elementName = elementName2;
  }
};
var ParseTreeResult = class {
  rootNodes;
  errors;
  constructor(rootNodes, errors) {
    this.rootNodes = rootNodes;
    this.errors = errors;
  }
};
var Parser2 = class {
  getTagDefinition;
  constructor(getTagDefinition) {
    this.getTagDefinition = getTagDefinition;
  }
  parse(source, url, options, isTagNameCaseSensitive = false, getTagContentType) {
    const lowercasify = (fn) => (x, ...args) => fn(x.toLowerCase(), ...args);
    const getTagDefinition = isTagNameCaseSensitive ? this.getTagDefinition : lowercasify(this.getTagDefinition);
    const getDefaultTagContentType = (tagName) => getTagDefinition(tagName).getContentType();
    const getTagContentTypeWithProcessedTagName = isTagNameCaseSensitive ? getTagContentType : lowercasify(getTagContentType);
    const tokenizeResult = tokenize(source, url, getTagContentType ? (tagName, prefix2, hasParent, attrs) => {
      const contentType = getTagContentTypeWithProcessedTagName(tagName, prefix2, hasParent, attrs);
      return contentType !== void 0 ? contentType : getDefaultTagContentType(tagName);
    } : getDefaultTagContentType, options);
    const canSelfClose = options && options.canSelfClose || false;
    const allowHtmComponentClosingTags = options && options.allowHtmComponentClosingTags || false;
    const parser = new _TreeBuilder(tokenizeResult.tokens, getTagDefinition, canSelfClose, allowHtmComponentClosingTags, isTagNameCaseSensitive);
    parser.build();
    return new ParseTreeResult(parser.rootNodes, [...tokenizeResult.errors, ...parser.errors]);
  }
};
var _TreeBuilder = class _TreeBuilder2 {
  tokens;
  tagDefinitionResolver;
  canSelfClose;
  allowHtmComponentClosingTags;
  isTagNameCaseSensitive;
  _index = -1;
  _peek;
  _containerStack = [];
  rootNodes = [];
  errors = [];
  constructor(tokens2, tagDefinitionResolver, canSelfClose, allowHtmComponentClosingTags, isTagNameCaseSensitive) {
    this.tokens = tokens2;
    this.tagDefinitionResolver = tagDefinitionResolver;
    this.canSelfClose = canSelfClose;
    this.allowHtmComponentClosingTags = allowHtmComponentClosingTags;
    this.isTagNameCaseSensitive = isTagNameCaseSensitive;
    this._advance();
  }
  build() {
    while (this._peek.type !== 43) if (this._peek.type === 0 || this._peek.type === 4) this._consumeElementStartTag(this._advance());
    else if (this._peek.type === 3) {
      this._closeVoidElement();
      this._consumeElementEndTag(this._advance());
    } else if (this._peek.type === 13) {
      this._closeVoidElement();
      this._consumeCdata(this._advance());
    } else if (this._peek.type === 10) {
      this._closeVoidElement();
      this._consumeComment(this._advance());
    } else if (this._peek.type === 5 || this._peek.type === 7 || this._peek.type === 6) {
      this._closeVoidElement();
      this._consumeText(this._advance());
    } else if (this._peek.type === 21) this._consumeExpansion(this._advance());
    else if (this._peek.type === 26) {
      this._closeVoidElement();
      this._consumeBlockOpen(this._advance());
    } else if (this._peek.type === 28) {
      this._closeVoidElement();
      this._consumeBlockClose(this._advance());
    } else if (this._peek.type === 30) {
      this._closeVoidElement();
      this._consumeIncompleteBlock(this._advance());
    } else if (this._peek.type === 31) {
      this._closeVoidElement();
      this._consumeLet(this._advance());
    } else if (this._peek.type === 19) this._consumeDocType(this._advance());
    else if (this._peek.type === 34) {
      this._closeVoidElement();
      this._consumeIncompleteLet(this._advance());
    } else if (this._peek.type === 35 || this._peek.type === 39) this._consumeComponentStartTag(this._advance());
    else if (this._peek.type === 38) this._consumeComponentEndTag(this._advance());
    else this._advance();
    for (const leftoverContainer of this._containerStack) if (leftoverContainer instanceof Block) this.errors.push(TreeError.create(leftoverContainer.name, leftoverContainer.sourceSpan, `Unclosed block "${leftoverContainer.name}"`));
  }
  _advance() {
    const prev = this._peek;
    if (this._index < this.tokens.length - 1) this._index++;
    this._peek = this.tokens[this._index];
    return prev;
  }
  _advanceIf(type) {
    if (this._peek.type === type) return this._advance();
    return null;
  }
  _consumeCdata(startToken) {
    const text = this._advance();
    const value = this._getText(text);
    const endToken = this._advanceIf(14);
    this._addToParent(new CDATA(value, new ParseSourceSpan(startToken.sourceSpan.start, (endToken || text).sourceSpan.end), [text]));
  }
  _consumeComment(token) {
    const text = this._advanceIf(7);
    const endToken = this._advanceIf(11);
    const value = text != null ? text.parts[0].trim() : null;
    const sourceSpan = endToken == null ? token.sourceSpan : new ParseSourceSpan(token.sourceSpan.start, endToken.sourceSpan.end, token.sourceSpan.fullStart);
    this._addToParent(new Comment(value, sourceSpan));
  }
  _consumeDocType(startToken) {
    const text = this._advanceIf(7);
    const endToken = this._advanceIf(20);
    const value = text != null ? text.parts[0].trim() : null;
    const sourceSpan = new ParseSourceSpan(startToken.sourceSpan.start, (endToken || text || startToken).sourceSpan.end);
    this._addToParent(new DocType(value, sourceSpan));
  }
  _consumeExpansion(token) {
    const switchValue = this._advance();
    const type = this._advance();
    const cases = [];
    while (this._peek.type === 22) {
      const expCase = this._parseExpansionCase();
      if (!expCase) return;
      cases.push(expCase);
    }
    if (this._peek.type !== 25) {
      this.errors.push(TreeError.create(null, this._peek.sourceSpan, `Invalid ICU message. Missing '}'.`));
      return;
    }
    const sourceSpan = new ParseSourceSpan(token.sourceSpan.start, this._peek.sourceSpan.end, token.sourceSpan.fullStart);
    this._addToParent(new Expansion(switchValue.parts[0], type.parts[0], cases, sourceSpan, switchValue.sourceSpan));
    this._advance();
  }
  _parseExpansionCase() {
    const value = this._advance();
    if (this._peek.type !== 23) {
      this.errors.push(TreeError.create(null, this._peek.sourceSpan, `Invalid ICU message. Missing '{'.`));
      return null;
    }
    const start = this._advance();
    const exp = this._collectExpansionExpTokens(start);
    if (!exp) return null;
    const end = this._advance();
    exp.push({
      type: 43,
      parts: [],
      sourceSpan: end.sourceSpan
    });
    const expansionCaseParser = new _TreeBuilder2(exp, this.tagDefinitionResolver, this.canSelfClose, this.allowHtmComponentClosingTags, this.isTagNameCaseSensitive);
    expansionCaseParser.build();
    if (expansionCaseParser.errors.length > 0) {
      this.errors = this.errors.concat(expansionCaseParser.errors);
      return null;
    }
    const sourceSpan = new ParseSourceSpan(value.sourceSpan.start, end.sourceSpan.end, value.sourceSpan.fullStart);
    const expSourceSpan = new ParseSourceSpan(start.sourceSpan.start, end.sourceSpan.end, start.sourceSpan.fullStart);
    return new ExpansionCase(value.parts[0], expansionCaseParser.rootNodes, sourceSpan, value.sourceSpan, expSourceSpan);
  }
  _collectExpansionExpTokens(start) {
    const exp = [];
    const expansionFormStack = [23];
    while (true) {
      if (this._peek.type === 21 || this._peek.type === 23) expansionFormStack.push(this._peek.type);
      if (this._peek.type === 24) if (lastOnStack(expansionFormStack, 23)) {
        expansionFormStack.pop();
        if (expansionFormStack.length === 0) return exp;
      } else {
        this.errors.push(TreeError.create(null, start.sourceSpan, `Invalid ICU message. Missing '}'.`));
        return null;
      }
      if (this._peek.type === 25) if (lastOnStack(expansionFormStack, 21)) expansionFormStack.pop();
      else {
        this.errors.push(TreeError.create(null, start.sourceSpan, `Invalid ICU message. Missing '}'.`));
        return null;
      }
      if (this._peek.type === 43) {
        this.errors.push(TreeError.create(null, start.sourceSpan, `Invalid ICU message. Missing '}'.`));
        return null;
      }
      exp.push(this._advance());
    }
  }
  _getText(token) {
    let text = token.parts[0];
    if (text.length > 0 && text[0] == "\n") {
      var _this$_getTagDefiniti;
      const parent = this._getClosestElementLikeParent();
      if (parent != null && parent.children.length == 0 && ((_this$_getTagDefiniti = this._getTagDefinition(parent)) === null || _this$_getTagDefiniti === void 0 ? void 0 : _this$_getTagDefiniti.ignoreFirstLf)) text = text.substring(1);
    }
    return text;
  }
  _consumeText(token) {
    const tokens2 = [token];
    const startSpan = token.sourceSpan;
    let text = token.parts[0];
    if (text.length > 0 && text[0] === "\n") {
      var _this$_getTagDefiniti2;
      const parent = this._getContainer();
      if (parent != null && parent.children.length === 0 && ((_this$_getTagDefiniti2 = this._getTagDefinition(parent)) === null || _this$_getTagDefiniti2 === void 0 ? void 0 : _this$_getTagDefiniti2.ignoreFirstLf)) {
        text = text.substring(1);
        tokens2[0] = {
          type: token.type,
          sourceSpan: token.sourceSpan,
          parts: [text]
        };
      }
    }
    while (this._peek.type === 8 || this._peek.type === 5 || this._peek.type === 9) {
      token = this._advance();
      tokens2.push(token);
      if (token.type === 8) text += token.parts.join("").replace(/&([^;]+);/g, decodeEntity);
      else if (token.type === 9) text += token.parts[0];
      else text += token.parts.join("");
    }
    if (text.length > 0) {
      const endSpan = token.sourceSpan;
      this._addToParent(new Text(text, new ParseSourceSpan(startSpan.start, endSpan.end, startSpan.fullStart, startSpan.details), tokens2));
    }
  }
  _closeVoidElement() {
    var _this$_getTagDefiniti3;
    const el = this._getContainer();
    if (el !== null && ((_this$_getTagDefiniti3 = this._getTagDefinition(el)) === null || _this$_getTagDefiniti3 === void 0 ? void 0 : _this$_getTagDefiniti3.isVoid)) this._containerStack.pop();
  }
  _consumeElementStartTag(startTagToken) {
    var _this$_getTagDefiniti4;
    const attrs = [];
    const directives = [];
    const comments = [];
    this._consumeAttributesAndDirectives(attrs, directives, comments);
    const fullName = this._getElementFullName(startTagToken, this._getClosestElementLikeParent());
    const tagDef = this._getTagDefinition(fullName);
    let selfClosing = false;
    if (this._peek.type === 2) {
      this._advance();
      selfClosing = true;
      const tagDef2 = this._getTagDefinition(fullName);
      if (!(this.canSelfClose || (tagDef2 === null || tagDef2 === void 0 ? void 0 : tagDef2.canSelfClose) || getNsPrefix(fullName) !== null || (tagDef2 === null || tagDef2 === void 0 ? void 0 : tagDef2.isVoid))) this.errors.push(TreeError.create(fullName, startTagToken.sourceSpan, `Only void, custom and foreign elements can be self closed "${startTagToken.parts[1]}"`));
    } else if (this._peek.type === 1) {
      this._advance();
      selfClosing = false;
    }
    const end = this._peek.sourceSpan.fullStart;
    const span = new ParseSourceSpan(startTagToken.sourceSpan.start, end, startTagToken.sourceSpan.fullStart);
    const startSpan = new ParseSourceSpan(startTagToken.sourceSpan.start, end, startTagToken.sourceSpan.fullStart);
    const nameSpan = new ParseSourceSpan(startTagToken.sourceSpan.start.moveBy(1), startTagToken.sourceSpan.end);
    const el = new Element(fullName, attrs, directives, [], selfClosing, span, startSpan, void 0, nameSpan, (tagDef === null || tagDef === void 0 ? void 0 : tagDef.isVoid) ?? false, void 0, comments);
    const parent = this._getContainer();
    const isClosedByChild = parent !== null && !!((_this$_getTagDefiniti4 = this._getTagDefinition(parent)) === null || _this$_getTagDefiniti4 === void 0 ? void 0 : _this$_getTagDefiniti4.isClosedByChild(el.name));
    this._pushContainer(el, isClosedByChild);
    if (selfClosing) this._popContainer(fullName, Element, span);
    else if (startTagToken.type === 4) {
      this._popContainer(fullName, Element, null);
      this.errors.push(TreeError.create(fullName, span, `Opening tag "${fullName}" not terminated.`));
    }
  }
  _consumeComponentStartTag(startToken) {
    var _this$_getTagDefiniti5;
    const componentName2 = startToken.parts[0];
    const attrs = [];
    const directives = [];
    const comments = [];
    this._consumeAttributesAndDirectives(attrs, directives, comments);
    const closestElement = this._getClosestElementLikeParent();
    const tagName = this._getComponentTagName(startToken, closestElement);
    const fullName = this._getComponentFullName(startToken, closestElement);
    const selfClosing = this._peek.type === 37;
    this._advance();
    const end = this._peek.sourceSpan.fullStart;
    const span = new ParseSourceSpan(startToken.sourceSpan.start, end, startToken.sourceSpan.fullStart);
    const node = new Component(componentName2, tagName, fullName, attrs, directives, [], selfClosing, span, new ParseSourceSpan(startToken.sourceSpan.start, end, startToken.sourceSpan.fullStart), void 0, void 0, comments);
    const parent = this._getContainer();
    const isClosedByChild = parent !== null && node.tagName !== null && !!((_this$_getTagDefiniti5 = this._getTagDefinition(parent)) === null || _this$_getTagDefiniti5 === void 0 ? void 0 : _this$_getTagDefiniti5.isClosedByChild(node.tagName));
    this._pushContainer(node, isClosedByChild);
    if (selfClosing) this._popContainer(fullName, Component, span);
    else if (startToken.type === 39) {
      this._popContainer(fullName, Component, null);
      this.errors.push(TreeError.create(fullName, span, `Opening tag "${fullName}" not terminated.`));
    }
  }
  _consumeAttributesAndDirectives(attributesResult, directivesResult, commentsResult) {
    while (this._peek.type === 15 || this._peek.type === 40 || this._peek.type === 12) if (this._peek.type === 40) directivesResult.push(this._consumeDirective(this._peek));
    else if (this._peek.type === 15) attributesResult.push(this._consumeAttr(this._advance()));
    else {
      const commentToken = this._advance();
      commentsResult.push(new StartTagComment(commentToken.parts[0], commentToken.parts[1], commentToken.sourceSpan));
    }
  }
  _consumeComponentEndTag(endToken) {
    const fullName = this._getComponentFullName(endToken, this._getClosestElementLikeParent());
    if (!this._popContainer(fullName, Component, endToken.sourceSpan)) {
      const container = this._containerStack[this._containerStack.length - 1];
      let suffix;
      if (container instanceof Component && container.componentName === endToken.parts[0]) suffix = `, did you mean "${container.fullName}"?`;
      else suffix = ". It may happen when the tag has already been closed by another tag.";
      const errMsg = `Unexpected closing tag "${fullName}"${suffix}`;
      this.errors.push(TreeError.create(fullName, endToken.sourceSpan, errMsg));
    }
  }
  _getTagDefinition(nodeOrName) {
    if (typeof nodeOrName === "string") return this.tagDefinitionResolver(nodeOrName);
    else if (nodeOrName instanceof Element) return this.tagDefinitionResolver(nodeOrName.name);
    else if (nodeOrName instanceof Component && nodeOrName.tagName !== null) return this.tagDefinitionResolver(nodeOrName.tagName);
    else return null;
  }
  _pushContainer(node, isClosedByChild) {
    if (isClosedByChild) this._containerStack.pop();
    this._addToParent(node);
    this._containerStack.push(node);
  }
  _consumeElementEndTag(endTagToken) {
    var _this$_getTagDefiniti6;
    const fullName = this.allowHtmComponentClosingTags && endTagToken.parts.length === 0 ? null : this._getElementFullName(endTagToken, this._getClosestElementLikeParent());
    if (fullName && ((_this$_getTagDefiniti6 = this._getTagDefinition(fullName)) === null || _this$_getTagDefiniti6 === void 0 ? void 0 : _this$_getTagDefiniti6.isVoid)) this.errors.push(TreeError.create(fullName, endTagToken.sourceSpan, `Void elements do not have end tags "${endTagToken.parts[1]}"`));
    else if (!this._popContainer(fullName, Element, endTagToken.sourceSpan)) {
      const errMsg = `Unexpected closing tag "${fullName}". It may happen when the tag has already been closed by another tag. For more info see https://www.w3.org/TR/html5/syntax.html#closing-elements-that-have-implied-end-tags`;
      this.errors.push(TreeError.create(fullName, endTagToken.sourceSpan, errMsg));
    }
  }
  /**
  * Closes the nearest element with the tag name `fullName` in the parse tree.
  * `endSourceSpan` is the span of the closing tag, or null if the element does
  * not have a closing tag (for example, this happens when an incomplete
  * opening tag is recovered).
  */
  _popContainer(expectedName, expectedType, endSourceSpan) {
    let unexpectedCloseTagDetected = false;
    for (let stackIndex = this._containerStack.length - 1; stackIndex >= 0; stackIndex--) {
      var _this$_getTagDefiniti7;
      const node = this._containerStack[stackIndex];
      const nodeName = node instanceof Component ? node.fullName : node.name;
      if (getNsPrefix(nodeName) ? nodeName === expectedName : (nodeName === expectedName || expectedName === null) && node instanceof expectedType) {
        node.endSourceSpan = endSourceSpan;
        node.sourceSpan.end = endSourceSpan !== null ? endSourceSpan.end : node.sourceSpan.end;
        this._containerStack.splice(stackIndex, this._containerStack.length - stackIndex);
        return !unexpectedCloseTagDetected;
      }
      if (node instanceof Block || !((_this$_getTagDefiniti7 = this._getTagDefinition(node)) === null || _this$_getTagDefiniti7 === void 0 ? void 0 : _this$_getTagDefiniti7.closedByParent)) unexpectedCloseTagDetected = true;
    }
    return false;
  }
  _consumeAttr(attrName) {
    const fullName = mergeNsAndName(attrName.parts[0], attrName.parts[1]);
    let attrEnd = attrName.sourceSpan.end;
    let startQuoteToken;
    if (this._peek.type === 16) startQuoteToken = this._advance();
    let value = "";
    const valueTokens = [];
    let valueStartSpan = void 0;
    let valueEnd = void 0;
    if (this._peek.type === 17) {
      valueStartSpan = this._peek.sourceSpan;
      valueEnd = this._peek.sourceSpan.end;
      while (this._peek.type === 17 || this._peek.type === 18 || this._peek.type === 9) {
        const valueToken = this._advance();
        valueTokens.push(valueToken);
        if (valueToken.type === 18) value += valueToken.parts.join("").replace(/&([^;]+);/g, decodeEntity);
        else if (valueToken.type === 9) value += valueToken.parts[0];
        else value += valueToken.parts.join("");
        valueEnd = attrEnd = valueToken.sourceSpan.end;
      }
    }
    if (this._peek.type === 16) valueEnd = attrEnd = this._advance().sourceSpan.end;
    const valueSpan = valueStartSpan && valueEnd && new ParseSourceSpan((startQuoteToken === null || startQuoteToken === void 0 ? void 0 : startQuoteToken.sourceSpan.start) ?? valueStartSpan.start, valueEnd, (startQuoteToken === null || startQuoteToken === void 0 ? void 0 : startQuoteToken.sourceSpan.fullStart) ?? valueStartSpan.fullStart);
    return new Attribute(fullName, value, new ParseSourceSpan(attrName.sourceSpan.start, attrEnd, attrName.sourceSpan.fullStart), attrName.sourceSpan, valueSpan, valueTokens.length > 0 ? valueTokens : void 0, void 0);
  }
  _consumeDirective(nameToken) {
    const attributes = [];
    let startSourceSpanEnd = nameToken.sourceSpan.end;
    let endSourceSpan = null;
    this._advance();
    if (this._peek.type === 41) {
      startSourceSpanEnd = this._peek.sourceSpan.end;
      this._advance();
      while (this._peek.type === 15) attributes.push(this._consumeAttr(this._advance()));
      if (this._peek.type === 42) {
        endSourceSpan = this._peek.sourceSpan;
        this._advance();
      } else this.errors.push(TreeError.create(null, nameToken.sourceSpan, "Unterminated directive definition"));
    }
    const startSourceSpan = new ParseSourceSpan(nameToken.sourceSpan.start, startSourceSpanEnd, nameToken.sourceSpan.fullStart);
    const sourceSpan = new ParseSourceSpan(startSourceSpan.start, endSourceSpan === null ? nameToken.sourceSpan.end : endSourceSpan.end, startSourceSpan.fullStart);
    return new Directive(nameToken.parts[0], attributes, sourceSpan, startSourceSpan, endSourceSpan);
  }
  _consumeBlockOpen(token) {
    const parameters = [];
    while (this._peek.type === 29) {
      const paramToken = this._advance();
      parameters.push(new BlockParameter(paramToken.parts[0], paramToken.sourceSpan));
    }
    if (this._peek.type === 27) this._advance();
    const end = this._peek.sourceSpan.fullStart;
    const span = new ParseSourceSpan(token.sourceSpan.start, end, token.sourceSpan.fullStart);
    const startSpan = new ParseSourceSpan(token.sourceSpan.start, end, token.sourceSpan.fullStart);
    const block = new Block(token.parts[0], parameters, [], span, token.sourceSpan, startSpan);
    this._pushContainer(block, false);
  }
  _consumeBlockClose(token) {
    const initialStackLength = this._containerStack.length;
    const topNode = this._containerStack[initialStackLength - 1];
    if (!this._popContainer(null, Block, token.sourceSpan)) {
      if (this._containerStack.length < initialStackLength) {
        const nodeName = topNode instanceof Component ? topNode.fullName : topNode.name;
        this.errors.push(TreeError.create(null, token.sourceSpan, `Unexpected closing block. The block may have been closed earlier. Did you forget to close the <${nodeName}> element? If you meant to write the \`}\` character, you should use the "&#125;" HTML entity instead.`));
        return;
      }
      this.errors.push(TreeError.create(null, token.sourceSpan, 'Unexpected closing block. The block may have been closed earlier. If you meant to write the `}` character, you should use the "&#125;" HTML entity instead.'));
    }
  }
  _consumeIncompleteBlock(token) {
    const parameters = [];
    while (this._peek.type === 29) {
      const paramToken = this._advance();
      parameters.push(new BlockParameter(paramToken.parts[0], paramToken.sourceSpan));
    }
    const end = this._peek.sourceSpan.fullStart;
    const span = new ParseSourceSpan(token.sourceSpan.start, end, token.sourceSpan.fullStart);
    const startSpan = new ParseSourceSpan(token.sourceSpan.start, end, token.sourceSpan.fullStart);
    const block = new Block(token.parts[0], parameters, [], span, token.sourceSpan, startSpan);
    this._pushContainer(block, false);
    this._popContainer(null, Block, null);
    this.errors.push(TreeError.create(token.parts[0], span, `Incomplete block "${token.parts[0]}". If you meant to write the @ character, you should use the "&#64;" HTML entity instead.`));
  }
  _consumeLet(startToken) {
    const name = startToken.parts[0];
    let valueToken;
    let endToken;
    if (this._peek.type !== 32) {
      this.errors.push(TreeError.create(startToken.parts[0], startToken.sourceSpan, `Invalid @let declaration "${name}". Declaration must have a value.`));
      return;
    } else valueToken = this._advance();
    if (this._peek.type !== 33) {
      this.errors.push(TreeError.create(startToken.parts[0], startToken.sourceSpan, `Unterminated @let declaration "${name}". Declaration must be terminated with a semicolon.`));
      return;
    } else endToken = this._advance();
    const end = endToken.sourceSpan.end;
    const span = new ParseSourceSpan(startToken.sourceSpan.start, end, startToken.sourceSpan.fullStart);
    const startOffset = startToken.sourceSpan.toString().lastIndexOf(name);
    const nameSpan = new ParseSourceSpan(startToken.sourceSpan.start.moveBy(startOffset), startToken.sourceSpan.end);
    const node = new LetDeclaration(name, valueToken.parts[0], span, nameSpan, valueToken.sourceSpan);
    this._addToParent(node);
  }
  _consumeIncompleteLet(token) {
    const name = token.parts[0] ?? "";
    const nameString = name ? ` "${name}"` : "";
    if (name.length > 0) {
      const startOffset = token.sourceSpan.toString().lastIndexOf(name);
      const nameSpan = new ParseSourceSpan(token.sourceSpan.start.moveBy(startOffset), token.sourceSpan.end);
      const valueSpan = new ParseSourceSpan(token.sourceSpan.start, token.sourceSpan.start.moveBy(0));
      const node = new LetDeclaration(name, "", token.sourceSpan, nameSpan, valueSpan);
      this._addToParent(node);
    }
    this.errors.push(TreeError.create(token.parts[0], token.sourceSpan, `Incomplete @let declaration${nameString}. @let declarations must be written as \`@let <name> = <value>;\``));
  }
  _getContainer() {
    return this._containerStack.length > 0 ? this._containerStack[this._containerStack.length - 1] : null;
  }
  _getClosestElementLikeParent() {
    for (let i = this._containerStack.length - 1; i > -1; i--) {
      const current = this._containerStack[i];
      if (current instanceof Element || current instanceof Component) return current;
    }
    return null;
  }
  _addToParent(node) {
    const parent = this._getContainer();
    if (parent === null) this.rootNodes.push(node);
    else parent.children.push(node);
  }
  _getElementFullName(token, parent) {
    return mergeNsAndName(this._getPrefix(token, parent), token.parts[1]);
  }
  _getComponentFullName(token, parent) {
    const componentName2 = token.parts[0];
    const tagName = this._getComponentTagName(token, parent);
    if (tagName === null) return componentName2;
    return tagName.startsWith(":") ? componentName2 + tagName : `${componentName2}:${tagName}`;
  }
  _getComponentTagName(token, parent) {
    const prefix2 = this._getPrefix(token, parent);
    const tagName = token.parts[2];
    if (!prefix2 && !tagName) return null;
    else if (!prefix2 && tagName) return tagName;
    else return mergeNsAndName(prefix2, tagName || "ng-component");
  }
  _getPrefix(token, parent) {
    var _this$_getTagDefiniti8;
    let prefix2;
    let tagName;
    if (token.type === 35 || token.type === 39 || token.type === 38) {
      prefix2 = token.parts[1];
      tagName = token.parts[2];
    } else {
      prefix2 = token.parts[0];
      tagName = token.parts[1];
    }
    prefix2 = prefix2 || ((_this$_getTagDefiniti8 = this._getTagDefinition(tagName)) === null || _this$_getTagDefiniti8 === void 0 ? void 0 : _this$_getTagDefiniti8.implicitNamespacePrefix) || "";
    if (!prefix2 && parent) {
      const parentName = parent instanceof Element ? parent.name : parent.tagName;
      if (parentName !== null) {
        const parentTagName = splitNsName(parentName)[1];
        const parentTagDefinition = this._getTagDefinition(parentTagName);
        if (parentTagDefinition !== null && !parentTagDefinition.preventNamespaceInheritance) prefix2 = getNsPrefix(parentName);
      }
    }
    return prefix2;
  }
};
function lastOnStack(stack, element) {
  return stack.length > 0 && stack[stack.length - 1] === element;
}
function decodeEntity(match, entity) {
  if (NAMED_ENTITIES[entity] !== void 0) return NAMED_ENTITIES[entity] || match;
  if (/^#x[a-f0-9]+$/i.test(entity)) return String.fromCodePoint(parseInt(entity.slice(2), 16));
  if (/^#\d+$/.test(entity)) return String.fromCodePoint(parseInt(entity.slice(1), 10));
  return match;
}

// node_modules/angular-html-parser/dist/compiler/src/ml_parser/html_parser.mjs
var HtmlParser = class extends Parser2 {
  constructor() {
    super(getHtmlTagDefinition);
  }
  parse(source, url, options, isTagNameCaseSensitive = false, getTagContentType) {
    return super.parse(source, url, options, isTagNameCaseSensitive, getTagContentType);
  }
};

// node_modules/angular-html-parser/dist/index.mjs
var htmlParser;
function parseHtml(input, options = {}) {
  const { canSelfClose = false, allowHtmComponentClosingTags = false, allowStartTagComments = false, isTagNameCaseSensitive = false, getTagContentType, tokenizeAngularBlocks = false, tokenizeAngularLetDeclaration = false, enableAngularSelectorlessSyntax = false } = options;
  htmlParser ?? (htmlParser = new HtmlParser());
  return htmlParser.parse(input, "angular-html-parser", {
    tokenizeExpansionForms: tokenizeAngularBlocks,
    canSelfClose,
    allowHtmComponentClosingTags,
    allowStartTagComments,
    tokenizeBlocks: tokenizeAngularBlocks,
    tokenizeLet: tokenizeAngularLetDeclaration,
    selectorlessEnabled: enableAngularSelectorlessSyntax
  }, isTagNameCaseSensitive, getTagContentType);
}

// src/parse/template.ts
var BY_EXTENSION = [
  { pattern: /\.html$/i, kind: "angular" },
  { pattern: /\.vue$/i, kind: "vue" },
  { pattern: /\.svelte$/i, kind: "svelte" }
];
function templateKind(filePath) {
  return BY_EXTENSION.find((entry) => entry.pattern.test(filePath))?.kind ?? null;
}
var NOT_MARKUP = /* @__PURE__ */ new Set(["script", "style"]);
function vueTemplate(source) {
  const open2 = /<template[^>]*>/i.exec(source);
  if (open2 === null) return "";
  const start = open2.index + open2[0].length;
  const close = source.lastIndexOf("</template>");
  if (close <= start) return "";
  const before = source.slice(0, start).replace(/[^\n]/g, " ");
  return before + source.slice(start, close);
}
var isTemplateComponent = (name) => /^(?:[a-z][\w]*-[\w-]*|[A-Z][\w]*)$/.test(name);
function parseTemplate(source, kind) {
  const markup = kind === "vue" ? vueTemplate(source) : source;
  if (markup.trim() === "") return [];
  let rootNodes;
  try {
    ({ rootNodes } = parseHtml(markup, {
      canSelfClose: true,
      allowHtmComponentClosingTags: true,
      isTagNameCaseSensitive: true
    }));
  } catch {
    return [];
  }
  const found = [];
  const visit = (nodes, depth) => {
    for (const node of nodes) {
      const element = node;
      if (typeof element.name !== "string") continue;
      if (NOT_MARKUP.has(element.name.toLowerCase())) continue;
      const attributes = {};
      for (const attribute of element.attrs ?? []) attributes[attribute.name] = attribute.value;
      const text = (element.children ?? []).map((child) => child.value ?? "").join("").trim();
      found.push({
        name: element.name,
        attributes,
        // The parser counts from zero; every message in this tool counts from one.
        line: (element.startSourceSpan?.start.line ?? 0) + 1,
        text,
        depth
      });
      if (element.children !== void 0) visit(element.children, depth + 1);
    }
  };
  visit(rootNodes, 0);
  return found;
}

// src/sources/extract.ts
function jsxNameOf(element) {
  const name = element.openingElement.name;
  if (name.type === "JSXIdentifier") return name.name;
  if (name.type === "JSXMemberExpression" && name.property.type === "JSXIdentifier") {
    return name.property.name;
  }
  return null;
}
function screenRoot(program) {
  const returned = returnedRoots(program);
  const exported = returned.filter((one) => one.exported);
  const among = exported.length > 0 ? exported : returned;
  if (among.length > 0) return largest(among.map((one) => one.root));
  return positionalRoot(program);
}
function returnedRoots(program) {
  const body = program.body;
  if (!Array.isArray(body)) return [];
  const roots = [];
  for (const statement of body) {
    const exported = statement.type === "ExportNamedDeclaration" || statement.type === "ExportDefaultDeclaration";
    for (const fn of componentsIn2(statement)) {
      const root = returnsJsx(fn);
      if (root !== null) roots.push({ root, exported });
    }
  }
  return roots;
}
function componentsIn2(statement) {
  const node = statement.type === "ExportNamedDeclaration" || statement.type === "ExportDefaultDeclaration" ? statement.declaration ?? null : statement;
  if (node === null) return [];
  if (node.type === "FunctionDeclaration") return [node];
  if (node.type === "ArrowFunctionExpression" || node.type === "FunctionExpression") return [node];
  if (node.type !== "VariableDeclaration") return [];
  const out = [];
  for (const declarator of node.declarations) {
    const init = unwrapComponent(declarator.init ?? null);
    if (init !== null) out.push(init);
  }
  return out;
}
function unwrapComponent(node) {
  let current = node;
  for (let hop = 0; current !== null && hop < 4; hop++) {
    if (current.type === "ArrowFunctionExpression" || current.type === "FunctionExpression") {
      return current;
    }
    if (current.type !== "CallExpression" || current.arguments.length === 0) return null;
    current = current.arguments[0];
  }
  return null;
}
function returnsJsx(fn) {
  const body = fn.body ?? null;
  if (body === null) return null;
  if (body.type === "JSXElement") return body;
  const found = [];
  const visit = (node) => {
    if (node !== body && isFunction(node)) return;
    if (node.type === "ReturnStatement") {
      const argument = node.argument ?? null;
      for (const element of jsxIn(argument)) found.push(element);
      return;
    }
    for (const child of childNodes(node)) visit(child);
  };
  visit(body);
  return found.length === 0 ? null : largest(found);
}
var isFunction = (node) => node.type === "ArrowFunctionExpression" || node.type === "FunctionExpression" || node.type === "FunctionDeclaration";
function jsxIn(node) {
  if (node === null) return [];
  if (node.type === "JSXElement") return [node];
  if (node.type === "ConditionalExpression") {
    return [...jsxIn(node.consequent), ...jsxIn(node.alternate)];
  }
  if (node.type === "LogicalExpression") return jsxIn(node.right);
  if (node.type === "JSXFragment") {
    return node.children.filter((one) => one.type === "JSXElement");
  }
  return [];
}
var largest = (elements) => elements.reduce(
  (biggest, candidate) => (candidate.end ?? 0) - (candidate.start ?? 0) > (biggest.end ?? 0) - (biggest.start ?? 0) ? candidate : biggest
);
function positionalRoot(program) {
  const tops = [];
  walk(program, (node) => {
    if (node.type !== "JSXElement") return;
    const element = node;
    const start = element.start ?? -1;
    const end = element.end ?? -1;
    const nested = tops.some((other) => (other.start ?? -1) < start && (other.end ?? -1) > end);
    if (!nested) tops.push(element);
  });
  const outermost = tops.filter(
    (candidate) => !tops.some(
      (other) => other !== candidate && (other.start ?? -1) < (candidate.start ?? -1) && (other.end ?? -1) > (candidate.end ?? -1)
    )
  );
  if (outermost.length === 0) return null;
  return largest(outermost);
}
function nameOf(element) {
  const name = element.openingElement.name;
  if (name.type !== "JSXIdentifier") return null;
  return /^[A-Z]/.test(name.name) ? name.name : null;
}
var PATTERN_DEPTH = 4;
function templateShape(source, kind) {
  const nodes = parseTemplate(source, kind);
  if (nodes.length === 0) return null;
  const components = [...new Set(nodes.map((node) => node.name).filter(isTemplateComponent))];
  if (components.length === 0) return null;
  const holder = nodes.find((node) => isTemplateComponent(node.name)) ?? null;
  const pattern2 = [];
  for (let depth = 0; depth < PATTERN_DEPTH; depth++) {
    for (const node of nodes) {
      if (node.depth !== depth || !isTemplateComponent(node.name)) continue;
      if (!pattern2.includes(node.name)) pattern2.push(node.name);
    }
  }
  return {
    components,
    pattern: pattern2,
    props: {},
    holder: holder === null ? null : holder.name,
    body: holder === null ? [] : bodyAt(nodes, holder)
  };
}
function bodyAt(nodes, holder) {
  const at = nodes.indexOf(holder);
  const body = [];
  for (const node of nodes.slice(at + 1)) {
    if (node.depth <= holder.depth) break;
    if (node.depth === holder.depth + 1 && isTemplateComponent(node.name)) body.push(node.name);
  }
  return body;
}
function patternOf(root) {
  const skeleton = [];
  let level = [root];
  for (let depth = 0; depth < PATTERN_DEPTH && level.length > 0; depth++) {
    const next = [];
    for (const element of level) {
      const name = nameOf(element);
      if (name !== null && !skeleton.includes(name)) skeleton.push(name);
      for (const child of element.children) {
        if (child.type === "JSXElement") next.push(child);
      }
    }
    level = next;
  }
  return skeleton;
}
function shapeOf(source, kind) {
  if (kind !== void 0) return templateShape(source, kind);
  const ast = parseModule(source);
  if (ast === null) return null;
  const components = [];
  const props2 = {};
  const outermost = screenRoot(ast.program);
  walk(ast.program, (node) => {
    if (node.type !== "JSXElement") return;
    const name = nameOf(node);
    if (name === null) return;
    if (!components.includes(name)) components.push(name);
    for (const attribute of node.openingElement.attributes) {
      if (attribute.type !== "JSXAttribute") continue;
      if (attribute.name.type !== "JSXIdentifier") continue;
      if (attribute.value?.type !== "StringLiteral") continue;
      const forComponent = props2[name] ??= {};
      const values = forComponent[attribute.name.name] ??= [];
      if (!values.includes(attribute.value.value)) values.push(attribute.value.value);
    }
  });
  if (components.length === 0) return null;
  return {
    components,
    pattern: outermost === null ? [] : patternOf(outermost),
    props: props2,
    holder: outermost === null ? null : jsxNameOf(outermost),
    body: outermost === null ? [] : heldBy(outermost)
  };
}
function heldBy(element) {
  const names = [];
  const take = (node) => {
    if (node === null || node === void 0) return;
    switch (node.type) {
      case "JSXElement": {
        const name = nameOf(node);
        if (name !== null) names.push(name);
        return;
      }
      // Transparent: a fragment is not a component and holds no place.
      case "JSXFragment":
        for (const child of node.children) take(child);
        return;
      case "JSXExpressionContainer":
        take(node.expression);
        return;
      case "LogicalExpression":
        take(node.right);
        return;
      case "ConditionalExpression":
        take(node.consequent);
        take(node.alternate);
        return;
      case "ArrowFunctionExpression":
      case "FunctionExpression":
        take(node.body ?? null);
        return;
      case "CallExpression":
        for (const argument of node.arguments) take(argument);
        return;
      case "ParenthesizedExpression":
        take(node.expression ?? null);
        return;
      default:
        return;
    }
  };
  for (const child of element.children) take(child);
  return names;
}
var MAX_RAW = 8;
function rawMarkupOf(source, kind) {
  if (kind !== void 0) {
    const nodes = parseTemplate(source, kind);
    if (nodes.length === 0) return null;
    const tags2 = [];
    for (const node of nodes) {
      if (isTemplateComponent(node.name)) continue;
      if (!tags2.includes(node.name)) tags2.push(node.name);
    }
    return tags2;
  }
  const ast = parseModule(source);
  if (ast === null) return null;
  const found = /* @__PURE__ */ new Map();
  let renders = false;
  walk(ast.program, (node) => {
    if (node.type !== "JSXElement") return;
    renders = true;
    const name = node.openingElement.name;
    if (name.type !== "JSXIdentifier" || !/^[a-z]/.test(name.name)) return;
    const at = node.start ?? 0;
    const first = found.get(name.name);
    if (first === void 0 || at < first) found.set(name.name, at);
  });
  const tags = [...found.entries()].sort((a, b) => a[1] - b[1]).map(([name]) => name);
  if (!renders) return null;
  return tags;
}
function passedContent(source) {
  const ast = parseModule(source);
  if (ast === null) return { passed: [], unresolved: [] };
  const root = screenRoot(ast.program);
  if (root === null) return { passed: [], unresolved: [] };
  const declared = jsxBindings(ast.program);
  const passed = [];
  const unresolved = [];
  for (const child of root.children) {
    if (child.type !== "JSXElement") continue;
    const to = nameOf(child);
    if (to === null) continue;
    let found = 0;
    let opaque = null;
    for (const attribute of child.openingElement.attributes) {
      if (attribute.type !== "JSXAttribute" || attribute.name.type !== "JSXIdentifier") continue;
      const value = attribute.value;
      if (value?.type !== "JSXExpressionContainer") continue;
      const names = jsxNamesIn(value.expression, declared, /* @__PURE__ */ new Set());
      for (const name of names) {
        passed.push({ name, to, via: attribute.name.name });
        found++;
      }
      if (names.length === 0 && opaque === null && CONTENTISH.test(attribute.name.name)) {
        opaque = attribute.name.name;
      }
    }
    if (found === 0 && opaque !== null && heldBy(child).length === 0) {
      unresolved.push(`${to}.${opaque}`);
    }
  }
  return { passed, unresolved };
}
var CONTENTISH = /^(?:children|content|items|tabs|panels|sections|render|body|slots?|actions)$/i;
function jsxBindings(program) {
  const found = /* @__PURE__ */ new Map();
  walk(program, (node) => {
    if (node.type !== "VariableDeclarator") return;
    const id = node.id;
    const init = node.init ?? null;
    if (id === void 0 || id.type !== "Identifier" || init === null) return;
    found.set(id.name, init);
  });
  return found;
}
function jsxNamesIn(node, declared, seen) {
  if (node === null) return [];
  switch (node.type) {
    case "JSXElement": {
      const name = nameOf(node);
      return name === null ? [] : [name];
    }
    case "JSXFragment":
      return node.children.flatMap((one) => jsxNamesIn(one, declared, seen));
    case "Identifier": {
      if (seen.has(node.name)) return [];
      const bound = declared.get(node.name);
      return bound === void 0 ? [] : jsxNamesIn(bound, declared, new Set(seen).add(node.name));
    }
    case "ArrayExpression":
      return node.elements.flatMap(
        (one) => one === null ? [] : jsxNamesIn(one, declared, seen)
      );
    case "ObjectExpression":
      return node.properties.flatMap(
        (property) => property.type === "ObjectProperty" ? jsxNamesIn(property.value, declared, seen) : []
      );
    case "ConditionalExpression":
      return [
        ...jsxNamesIn(node.consequent, declared, seen),
        ...jsxNamesIn(node.alternate, declared, seen)
      ];
    case "LogicalExpression":
      return jsxNamesIn(node.right, declared, seen);
    case "TSAsExpression":
      return jsxNamesIn(node.expression, declared, seen);
    default:
      return [];
  }
}

// src/sources/regions.ts
var NAMES = [
  { region: "breadcrumbs", pattern: /(breadcrumb)/ },
  // `appheader` and `apptoolbar` were dead here: `normalise` strips a leading
  // `app`, so they arrive as `header` and `toolbar`. `bar` is MUI's `AppBar`
  // arriving the same way — the header component of a MUI project, previously
  // matching nothing at all.
  { region: "header", pattern: /(pageheader|^header$|^bar$|masthead|topbar)/ },
  { region: "nav", pattern: /(sidenav|sidebar|^nav$|navigation|navmenu|navrail)/ },
  { region: "footer", pattern: /(pagefooter|appfooter|^footer$)/ },
  { region: "actions", pattern: /(pageactions|actionbar|toolbar|actionsbar)/ },
  { region: "content", pattern: /(pagecontent|^content$|^main$|maincontent|pagebody|^body$)/ }
];
function bareName(name) {
  return name.replace(/[-_.]/g, "").toLowerCase();
}
function normalise(name) {
  const bare = bareName(name);
  return bare.startsWith("app") ? bare.slice(3) : bare;
}
function vendorPrefix(holder, name) {
  const a = bareName(holder);
  const b = bareName(name);
  let shared2 = 0;
  while (shared2 < a.length && shared2 < b.length && a[shared2] === b[shared2]) shared2++;
  if (shared2 < 2 || shared2 > 4) return null;
  if (shared2 === a.length || shared2 === b.length) return null;
  return a.slice(0, shared2);
}
function regionOf(name, holder) {
  const bare = normalise(name);
  const found = NAMES.find((entry) => entry.pattern.test(bare))?.region;
  if (found !== void 0) return found;
  if (holder === void 0) return null;
  const prefix2 = vendorPrefix(holder, name);
  if (prefix2 === null) return null;
  const stripped = bareName(name).slice(prefix2.length);
  return NAMES.find((entry) => entry.pattern.test(stripped))?.region ?? null;
}
function compareOrder(filled, stated2) {
  const present = [...new Set(filled)];
  const missing = stated2.filter((region) => !present.includes(region));
  const expected = stated2.filter((region) => present.includes(region));
  const actual = present.filter((region) => expected.includes(region));
  return { present, missing, actual, expected, inOrder: actual.join(">") === expected.join(">") };
}
var renderedElements = (child) => {
  if (child.type === "JSXElement") return [child];
  if (child.type !== "JSXExpressionContainer" && child.type !== "JSXFragment") return [];
  const found = [];
  walk(child, (node) => {
    if (node.type === "JSXElement") found.push(node);
  });
  return found.filter(
    (candidate) => !found.some(
      (other) => other !== candidate && (other.start ?? -1) < (candidate.start ?? -1) && (other.end ?? -1) > (candidate.start ?? -1)
    )
  );
};
function fromJsx(source) {
  const ast = parseModule(source);
  if (ast === null) return null;
  const root = screenRoot(ast.program);
  if (root === null) return null;
  const holder = jsxNameOf(root);
  if (holder === null) return null;
  const order = [];
  const body = [];
  for (const child of root.children) {
    for (const element of renderedElements(child)) {
      const name = jsxNameOf(element);
      if (name === null) continue;
      const region = regionOf(name, holder);
      if (region === null) continue;
      order.push({ region, component: name });
      if (region === "content") {
        walk(element, (node) => {
          if (node.type !== "JSXElement" || node === element) return;
          const inner = jsxNameOf(node);
          if (inner !== null && !body.includes(inner)) body.push(inner);
        });
      }
    }
  }
  return { holder, order, body };
}
var TRANSPARENT = /* @__PURE__ */ new Set(["ng-container", "ng-template", "template", "svelte:fragment"]);
function fromTemplate(source, kind) {
  const nodes = parseTemplate(source, kind);
  const rootAt = nodes.findIndex((node) => node.depth === 0);
  if (rootAt < 0) return null;
  const root = nodes[rootAt];
  const end = nodes.findIndex((node, index) => index > rootAt && node.depth === 0);
  const subtree = nodes.slice(rootAt + 1, end < 0 ? void 0 : end);
  const order = [];
  const body = [];
  const transparent = [];
  let contentDepth = null;
  for (const node of subtree) {
    while (transparent.length > 0 && node.depth <= transparent[transparent.length - 1]) {
      transparent.pop();
    }
    const effective = node.depth - transparent.length;
    if (TRANSPARENT.has(node.name.toLowerCase())) {
      transparent.push(node.depth);
      continue;
    }
    if (contentDepth !== null && effective > contentDepth) {
      if (!body.includes(node.name)) body.push(node.name);
      continue;
    }
    if (effective !== 1) continue;
    const region = regionOf(node.name, root.name);
    contentDepth = region === "content" ? effective : null;
    if (region === null) continue;
    order.push({ region, component: node.name });
  }
  return { holder: root.name, order, body };
}
function regionsOf(source, kind) {
  return kind === void 0 ? fromJsx(source) : fromTemplate(source, kind);
}

// src/knowledge/page-rules.ts
var IN_ORDER = /\bin order\b/i;
var pageRules = (knowledge) => {
  const rules = [];
  for (const fragment of knowledge.fragments) {
    if (fragment.generated === true) continue;
    const marker = IN_ORDER.exec(fragment.body);
    if (marker === null) continue;
    const before = [...fragment.body.slice(0, marker.index).matchAll(COMPONENT)].map((m) => m[1] ?? m[2]);
    const holder = before.filter((name) => regionOf(name) === null).at(-1);
    if (holder === void 0) continue;
    const order = [];
    for (const match of fragment.body.slice(marker.index).matchAll(COMPONENT)) {
      const region = regionOf(match[1] ?? match[2], holder);
      if (region !== null && !order.includes(region)) order.push(region);
    }
    if (order.length === 0) continue;
    rules.push({ holder, order, subject: fragment.subject, id: fragment.id });
  }
  return rules;
};

// src/checks/page.ts
var pageFindings = (filePath, source, rules) => {
  if (rules.length === 0) return [];
  const kind = templateKind(filePath);
  const regions = kind === null ? regionsOf(source) : regionsOf(source, kind);
  if (regions === null) return [];
  const claiming = rules.filter((rule2) => rule2.holder === regions.holder);
  if (claiming.length !== 1) return [];
  const rule = claiming[0];
  const compared = compareOrder(
    regions.order.map((entry) => entry.region),
    rule.order
  );
  const findings = [];
  const say = (message) => {
    findings.push({ file: filePath, line: 1, level: "page-pattern", source: "knowledge", message });
  };
  for (const region of compared.missing) {
    say(`This page has no ${region}. "${rule.subject}" says one belongs here.`);
  }
  if (!compared.inOrder) {
    say(
      `This page's regions are in the order ${compared.actual.join(", ")}. "${rule.subject}" says the order is ${compared.expected.join(", ")}.`
    );
  }
  return findings;
};

// src/checks/template.ts
function declarations(style) {
  const found = [];
  for (const part of style.split(";")) {
    const at = part.indexOf(":");
    if (at < 0) continue;
    const property = part.slice(0, at).trim().toLowerCase();
    const value = part.slice(at + 1).trim();
    if (property !== "" && value !== "") found.push({ property, value });
  }
  return found;
}
function styleFindingsFor(file, node) {
  const style = node.attributes["style"];
  if (style === void 0 || style.includes("{{") || style.includes("{")) return [];
  const findings = [];
  for (const { property, value } of declarations(style)) {
    if (isZeroLength(value)) continue;
    const isColour = isColourValue(value);
    const isLength = !isColour && takesLength(property) && isLengthValue(value);
    if (!isColour && !isLength) continue;
    findings.push({
      file,
      line: node.line,
      level: "style",
      message: `${quoted(property)}: ${quoted(value)} is a hardcoded ${isColour ? "colour" : "length"}, not a design-system token.`
    });
  }
  return findings;
}
function templateFindings(filePath, source, rules) {
  const kind = templateKind(filePath);
  if (kind === null) return [];
  const forbidden = /* @__PURE__ */ new Map();
  for (const rule of rules) {
    for (const name of rule.forbidden) if (!forbidden.has(name)) forbidden.set(name, rule);
  }
  const findings = [];
  for (const node of parseTemplate(source, kind)) {
    findings.push(...styleFindingsFor(filePath, node));
    if (isEmojiOnly(node.text)) {
      findings.push({
        file: filePath,
        line: node.line,
        level: "reuse",
        message: `${quoted(node.text)} is an emoji used as an icon. Use the design system's icon component so it matches the others.`
      });
    }
    const rule = forbidden.get(node.name);
    if (rule !== void 0) {
      findings.push({
        file: filePath,
        line: node.line,
        level: "reuse",
        source: "knowledge",
        symbol: node.name,
        message: `<${quoted(node.name)}> is not what this project uses here. "${quoted(rule.subject)}" says to use ${quoted(rule.canonical)}.`
      });
    }
  }
  return findings.sort((a, b) => a.line - b.line);
}

// src/core/engine.ts
var GENERATED = /(\.(?:test|spec|stories|story)\.[jt]sx?$)|(^|\/)__(?:tests|mocks)__\//;
function importFinding(violation) {
  return {
    ...violation,
    level: violation.reason === "deprecated" ? "deprecated" : "import",
    message: violation.reason === "deprecated" ? `${violation.symbol} is deprecated in ${violation.importedFrom}.` : importSentence([violation.symbol], violation.importedFrom, violation.expectedFrom)
  };
}
function collapseDeprecations(findings) {
  const usedAndFlagged = new Set(
    findings.filter((finding) => finding.level === "deprecated" && finding.importedFrom === void 0).map((finding) => finding.symbol)
  );
  return findings.filter(
    (finding) => !(finding.reason === "deprecated" && finding.importedFrom !== void 0 && usedAndFlagged.has(finding.symbol))
  );
}
async function runEngine(filePath, source, ctx) {
  if (ctx.includeTestFiles !== true && GENERATED.test(filePath)) return { tier1: [] };
  const kind = templateKind(filePath);
  if (kind !== null) {
    const elements = parseTemplate(source, kind).map((node) => node.name);
    const retrieved2 = ctx.knowledge === void 0 ? { fragments: [] } : { fragments: retrieve(source, ctx.knowledge, { filePath, terms: elements }) };
    return {
      tier1: [
        ...templateFindings(filePath, source, substitutionRules(retrieved2)),
        ...pageFindings(filePath, source, pageRules(retrieved2))
      ].sort((a, b) => a.line - b.line)
    };
  }
  const imports = checkSource(filePath, source, ctx.chain, ctx.inventory).filter((violation) => ctx.withinLayer === true || violation.withinOwnLayer !== true).map(importFinding);
  const retrieved = ctx.knowledge === void 0 ? { fragments: [] } : { fragments: retrieve(source, ctx.knowledge, { filePath }) };
  const tier1 = collapseDeprecations([
    ...imports,
    ...styleFindings(filePath, source),
    ...emojiFindings(filePath, source),
    ...deprecatedUsageFindings(filePath, source, ctx.chain, ctx.inventory),
    ...ctx.conventions === void 0 ? [] : propFindings(filePath, source, ctx.conventions, ctx.conventionsFrom),
    // Level one: the page's own structure, against a stated page rule.
    ...pageFindings(filePath, source, pageRules(retrieved)),
    // Curated "use X, never Y" rules. Deterministic because the rule is a
    // declaration somebody wrote, not a pattern inferred from the code next
    // door — no rule, no finding.
    //
    // Scoped by the same retrieval Tier 2 uses, so a rule only speaks about
    // what it is about. Applied globally, the widget rule told a *form* to use
    // a WidgetCard — a finding citing a rule that does not apply is worse than
    // no finding, because it teaches people to stop reading them.
    ...ctx.knowledge === void 0 ? [] : substitutionFindings(
      filePath,
      source,
      substitutionRules(retrieved),
      ctx.chain,
      ctx.inventory
    )
  ]).sort((a, b) => a.line - b.line);
  if (tier1.length > 0) return { tier1 };
  if (ctx.review === void 0 || ctx.knowledge === void 0) return { tier1 };
  const fragments = retrieved.fragments;
  if (fragments.length === 0) return { tier1 };
  const review2 = ctx.review;
  const tier2 = Promise.resolve().then(() => review2({ filePath, source, fragments })).catch(() => []);
  return { tier1, tier2 };
}

// src/ai/advice.ts
var SHAPE = {
  literal: "a literal",
  call: "a call",
  expression: "an expression"
};
var MAX_ADVICE = 1e4;
var RULES_BUDGET = 6e3;
function describe(holder) {
  return holder == null || holder === "" ? null : `held by ${holder}`;
}
function buildAdvice(input) {
  const text = input.markup === void 0 ? input.source : `${input.source}
${input.markup.source}`;
  const fragments = input.knowledge.fragments.length === 0 ? [] : retrieve(text, input.knowledge, { filePath: input.filePath });
  const usage = input.usage ?? [];
  if (fragments.length === 0 && usage.length === 0 && input.neighbours === void 0) return null;
  const structural = input.markup ?? { path: input.filePath, source: input.source };
  const dialect = templateKind(structural.path);
  const shape = shapeOf(structural.source, dialect ?? void 0);
  const holder = shape?.holder ?? null;
  const raw = shape === null && holder === null ? rawMarkupOf(structural.source, dialect ?? void 0)?.slice(0, MAX_RAW) ?? null : null;
  if (shape === null && holder === null) {
    if (raw === null) return null;
    if (input.neighbours === void 0 && usage.length === 0) return null;
  }
  const lines = [
    "ui-consistency: an advisory check on the screen just edited. This is not a",
    "finding and nothing here failed \u2014 the deterministic checks passed. Read what",
    fragments.length === 0 ? "is below against what the file actually is, and say so only" : "the project has written down below against what the file actually is, and say so only",
    "if something genuinely does not fit.",
    "",
    "Do not treat any of this as a rule to enforce, and do not rewrite working code",
    "to satisfy it. If it fits, say nothing.",
    "",
    `# What this file is (read from its code)`,
    // Absent rather than "unknown": an empty answer that reads as a judgement
    // about the screen is worse than no line at all.
    ...describe(holder) === null ? [] : [`- kind of screen: ${describe(holder)}`],
    `- layout: ${shape?.pattern.join(" > ") || (holder ?? "nothing structural found")}`
  ];
  if (raw !== null) {
    lines.push(
      `- renders no components at all \u2014 only raw markup: ${raw.join(", ") || "none named"}`,
      "  Worth a look against the list below: a screen built out of plain elements",
      "  is usually one written without the design system rather than a decision."
    );
  }
  if (input.neighbours !== void 0) {
    const kind = describe(input.neighbours.holder);
    lines.push("", "# What the screens beside it look like (a heuristic, not a rule)");
    if (kind !== null) lines.push(`- kind of screen: ${kind}`);
    if (input.neighbours.components.length > 0) {
      lines.push(`- commonly used: ${input.neighbours.components.slice(0, 12).join(", ")}`);
    }
  }
  if (usage.length > 0) {
    lines.push(
      "",
      "# How the screens beside it write those components (observed, not a rule)",
      "Only where the sibling screens agree. If this file writes one of these",
      "differently on purpose, that is fine \u2014 say nothing."
    );
    for (const one of usage) {
      const written = [
        // `scrollable`, not `scrollable="true"` — the second is not how anyone
        // writes it, and advice written in a dialect nobody uses reads as a
        // machine's guess rather than as what the file next door says. Only
        // where it was written bare, though: `aria-expanded="true"` is a string
        // and rendering it bare suggests writing it a way nobody there does.
        ...one.props.map((prop) => prop.bare ? prop.name : `${prop.name}="${quoted(prop.value)}"`),
        // `className` in JSX, `class` in a template, as the siblings wrote it.
        // Hard-coding `class` handed every React project an observation in a
        // dialect nobody there uses — and invalid JSX to copy.
        ...one.classes.length > 0 && one.classAttribute !== null ? [`${one.classAttribute}="${quoted(one.classes.join(" "))}"`] : []
      ].join(" ");
      const support = one.agreedBy === one.seenIn ? `on ${one.seenIn} of the screens beside it` : `used on ${one.seenIn} of the screens beside it, written this way on ${one.agreedBy}`;
      const opening = written === "" ? one.component : `${one.component} ${written}`;
      lines.push(`- \`<${opening}>\` \u2014 ${support}`);
      if (one.written.length > 0) {
        const named2 = one.written.map((prop) => {
          const how = prop.shape === null ? "" : ` (${SHAPE[prop.shape]})`;
          const many = prop.writtenBy >= one.seenIn ? "" : ` \u2014 on ${prop.writtenBy} of them`;
          return `${prop.name}${how}${many}`;
        }).join(", ");
        lines.push(`  screens of this kind also write: ${named2}`);
      }
    }
  }
  if (fragments.length > 0) {
    lines.push("", "# The project's own rules that bear on this file");
    let spent = 0;
    for (const fragment of fragments) {
      const block = `
## ${fragment.subject}
${fragment.body}`;
      if (spent + block.length > RULES_BUDGET) break;
      spent += block.length;
      lines.push(block);
    }
  }
  const advice = lines.join("\n");
  return advice.length > MAX_ADVICE ? advice.slice(0, MAX_ADVICE) : advice;
}

// src/sources/neighbours.ts
import { readFile as readFile14 } from "node:fs/promises";
import { dirname as dirname8 } from "node:path";

// src/sources/siblings.ts
import { readdir as readdir7, readFile as readFile12 } from "node:fs/promises";
import { basename as basename6, dirname as dirname6, isAbsolute as isAbsolute3, join as join13, relative as relative4 } from "node:path";

// src/sources/routes.ts
import { readdir as readdir6, readFile as readFile11, realpath as realpath2, stat as stat6 } from "node:fs/promises";
import { basename as basename5, dirname as dirname5, isAbsolute as isAbsolute2, join as join12, relative as relative3, sep as sep3 } from "node:path";

// src/sources/constants.ts
import { readFile as readFile10 } from "node:fs/promises";
import { dirname as dirname4, join as join11 } from "node:path";
async function constantsFor(file, source, moduleAt2, wanted) {
  const found = /* @__PURE__ */ new Map();
  if (wanted.size === 0) return found;
  const ast = parseModule(source, file);
  if (ast === null) return found;
  const program = ast.program;
  declaredIn(program, found);
  for (const [spec, names] of importedNames(program)) {
    if (!spec.startsWith(".")) continue;
    if (!names.some(([local]) => wanted.has(local))) continue;
    const path = await moduleAt2(join11(dirname4(file), spec));
    if (path === null) continue;
    const text = await readFile10(path, "utf8").catch(() => null);
    if (text === null || text.length > MAX_MODULE_BYTES) continue;
    const module = parseModule(text, path);
    if (module === null) continue;
    const theirs = /* @__PURE__ */ new Map();
    declaredIn(module.program, theirs);
    for (const [local, exported] of names) {
      if (exported === NAMESPACE) {
        for (const [key, value] of theirs) found.set(`${local}.${key}`, value);
        continue;
      }
      const own = theirs.get(exported);
      if (own !== void 0) found.set(local, own);
      for (const [key, value] of theirs) {
        if (key.startsWith(`${exported}.`)) found.set(`${local}.${key.slice(exported.length + 1)}`, value);
      }
    }
  }
  return found;
}
var MAX_MODULE_BYTES = 2e5;
var NAMESPACE = "*";
function declaredIn(program, into) {
  for (const node of statementsOf(program)) {
    const declaration = node.type === "ExportNamedDeclaration" ? node.declaration : node;
    if (declaration === null || declaration === void 0) continue;
    if (declaration.type === "TSEnumDeclaration") {
      const name = declaration.id.name;
      const holder = declaration;
      const members = Array.isArray(holder.body?.members) ? holder.body.members : holder.members;
      for (const member of members ?? []) {
        const key = member.id.type === "Identifier" ? member.id.name : member.id.type === "StringLiteral" ? member.id.value : null;
        const value = plainString(member.initializer);
        if (key !== null && value !== null) into.set(`${name}.${key}`, value);
      }
      continue;
    }
    if (declaration.type !== "VariableDeclaration") continue;
    for (const declarator of declaration.declarations) {
      if (declarator.id.type !== "Identifier") continue;
      const name = declarator.id.name;
      const init = unwrap(declarator.init);
      if (init === null) continue;
      const plain = plainString(init);
      if (plain !== null) {
        into.set(name, plain);
        continue;
      }
      if (init.type !== "ObjectExpression") continue;
      for (const property of init.properties) {
        if (property.type !== "ObjectProperty") continue;
        const key = property.key.type === "Identifier" ? property.key.name : property.key.type === "StringLiteral" ? property.key.value : null;
        const value = plainString(property.value);
        if (key !== null && value !== null) into.set(`${name}.${key}`, value);
      }
    }
  }
}
function unwrap(node) {
  let current = node ?? null;
  for (let hop = 0; current !== null && hop < 4; hop++) {
    if (current.type === "TSAsExpression" || current.type === "TSSatisfiesExpression") {
      current = current.expression;
      continue;
    }
    if (current.type === "CallExpression" && current.callee.type === "MemberExpression" && current.callee.property.type === "Identifier" && current.callee.property.name === "freeze" && current.arguments.length === 1) {
      current = current.arguments[0];
      continue;
    }
    return current;
  }
  return current;
}
var plainString = (node) => {
  if (node === null || node === void 0) return null;
  if (node.type === "StringLiteral") return node.value;
  if (node.type === "TemplateLiteral" && node.expressions.length === 0) {
    return node.quasis[0]?.value.cooked ?? null;
  }
  return null;
};
function statementsOf(program) {
  const out = [];
  const body = program.body;
  if (!Array.isArray(body)) return out;
  for (const statement of body) {
    out.push(statement);
    const inner = statement.body;
    if (inner !== null && typeof inner === "object" && Array.isArray(inner.body)) {
      out.push(...inner.body);
    }
  }
  return out;
}
function importedNames(program) {
  const out = /* @__PURE__ */ new Map();
  for (const statement of statementsOf(program)) {
    if (statement.type !== "ImportDeclaration") continue;
    const spec = statement.source.value;
    const names = out.get(spec) ?? [];
    for (const one of statement.specifiers) {
      if (one.type === "ImportSpecifier") {
        const exported = one.imported.type === "Identifier" ? one.imported.name : one.imported.value;
        names.push([one.local.name, exported]);
      } else if (one.type === "ImportDefaultSpecifier") {
        names.push([one.local.name, "default"]);
      } else if (one.type === "ImportNamespaceSpecifier") {
        names.push([one.local.name, NAMESPACE]);
      }
    }
    out.set(spec, names);
  }
  return out;
}

// src/sources/routes.ts
var ROUTE_SCREEN = /^\+?page\.[jt]sx?$|^\+page\.svelte$/;
var ROUTES_ROOT = /^(app|routes|pages)$/;
var ROUTE_TABLE = /(routes?|router|app)\.[jt]sx?$|routing\.module\.[jt]s$/i;
var ROUTE_DIR = /^(router|routes)$/i;
var SKIP_DIR = /^(node_modules|dist|build|out|coverage|\.git|\.next|\.svelte-kit|mock|mocks|__mocks__|fixtures?|tests?|e2e|cypress)$/i;
var MAX_TABLE_BYTES = 2e5;
var MAX_TABLES = 40;
var MAX_READS = 40;
var MAX_NAMES = 8;
var BINDS = /\b(component|element|lazy|loadChildren)\b|\bimport\s*\(|<Route\b/;
var isGroup = (segment) => /^\(.*\)$/.test(segment);
function fileRoutedPath(screen, root) {
  if (!ROUTE_SCREEN.test(basename5(screen))) return null;
  const parts = relative3(root, dirname5(screen)).split(sep3).filter((part) => part !== "");
  const at = parts.findIndex((part) => ROUTES_ROOT.test(part));
  if (at < 0) return null;
  return parts.slice(at + 1).filter((part) => !isGroup(part));
}
async function tablesNear(screen, root) {
  const found = [];
  const seen = /* @__PURE__ */ new Set();
  let budget = MAX_READS;
  const collect3 = async (dir2, skip, descend) => {
    if (budget <= 0 || found.length >= MAX_TABLES) return;
    const entries = await readdir6(dir2, { withFileTypes: true }).catch(() => null);
    budget--;
    if (entries === null) return;
    const folders = [];
    for (const entry of entries) {
      if (entry.name.startsWith(".") || SKIP_DIR.test(entry.name)) continue;
      const path = join12(dir2, entry.name);
      if (entry.isDirectory()) {
        if (path !== skip) folders.push(path);
        continue;
      }
      if (!ROUTE_TABLE.test(entry.name) && !ROUTE_DIR.test(basename5(dir2))) continue;
      if (seen.has(path)) continue;
      seen.add(path);
      found.push(path);
      if (found.length >= MAX_TABLES) return;
    }
    if (!descend) return;
    for (const folder of folders) {
      if (budget <= 0 || found.length >= MAX_TABLES) return;
      await collect3(folder, null, false);
    }
  };
  let dir = dirname5(screen);
  let from = null;
  for (; ; ) {
    await collect3(dir, from, true);
    if (dir === root || budget <= 0) break;
    const next = dirname5(dir);
    if (next === dir) break;
    from = dir;
    dir = next;
  }
  return found;
}
async function namesOf(screen) {
  const bare = basename5(screen).replace(/\.[jt]sx?$|\.vue$|\.svelte$/, "");
  const names = [/^(index|\+?page)$/i.test(bare) ? basename5(dirname5(screen)) : bare];
  const source = await readFile11(screen, "utf8").catch(() => null);
  if (source !== null && source.length <= MAX_TABLE_BYTES) {
    for (const exported of exportedSymbolsFromSource(source)) {
      if (!/^[A-Z]/.test(exported)) continue;
      if (!names.includes(exported)) names.push(exported);
      if (names.length >= MAX_NAMES) break;
    }
  }
  return names;
}
async function declaredPath(screen, root) {
  const names = await namesOf(screen);
  const found = await tablesNear(screen, root);
  for (const file of found) {
    if (file === screen) continue;
    const source = await readFile11(file, "utf8").catch(() => null);
    if (source === null || source.length > MAX_TABLE_BYTES) continue;
    if (!names.some((name) => source.includes(name))) continue;
    const ast = parseModule(source, file);
    if (ast === null) continue;
    const constants = await constantsFor(
      file,
      source,
      insideProject2(root),
      namedPaths(ast.program)
    );
    const entry = entryFor(ast.program, names, [], false, constants);
    if (entry !== null) {
      const literal = constants.size === 0 ? entry : entryFor(ast.program, names, [], false);
      return {
        path: entry.path,
        declaredIn: { file, line: entry.line },
        binding: bindingOf(ast.program, names, entry, constants),
        absolute: entry.absolute,
        fromConstant: entry.path !== null && literal?.path !== entry.path
      };
    }
  }
  return null;
}
function bindingOf(program, names, entry, constants) {
  let binding = null;
  let hits = 0;
  for (const array of tableArrays(program)) {
    const found = entryFor(array.node, names, [], false, constants);
    if (found === null || found.line !== entry.line) continue;
    binding = array.name;
    hits++;
  }
  return hits === 1 ? binding : null;
}
var PATH_KEYS = /* @__PURE__ */ new Set(["path"]);
var BINDING_KEYS = /* @__PURE__ */ new Set(["component", "Component", "element", "lazy", "loadChildren"]);
var CHILD_KEYS = /* @__PURE__ */ new Set(["children", "routes"]);
var ROUTE_TAG = /Route$/;
var segmentsOf = (segments) => segments.flatMap((one) => one.split("/")).filter((one) => one !== "");
var joined = (segments) => segments.length === 0 ? null : `/${segmentsOf(segments).join("/")}`;
var asPrefix = (segments) => {
  const parts = segmentsOf(segments);
  return parts[parts.length - 1] === "*" ? parts.slice(0, -1) : parts;
};
var isRooted = (own) => own.some((one) => one.startsWith("/"));
var NO_CONSTANTS = /* @__PURE__ */ new Map();
var stringOf = (node, constants = NO_CONSTANTS) => {
  const plain = plainString(node);
  if (plain !== null) return plain;
  if (node === null || node === void 0) return null;
  if (node.type === "TemplateLiteral") {
    let out = "";
    for (const [at, quasi] of node.quasis.entries()) {
      out += quasi.value.cooked ?? "";
      const expression = node.expressions[at];
      if (expression === void 0) continue;
      const value = named(expression, constants);
      if (value === null) return null;
      out += value;
    }
    return out;
  }
  return named(node, constants);
};
function named(node, constants) {
  if (constants.size === 0) return null;
  const key = dotted(node);
  return key === null ? null : constants.get(key) ?? null;
}
var insideProject2 = (root) => async (base) => {
  const found = await moduleAt(base);
  if (found === null) return null;
  const [real, home] = await Promise.all([
    realpath2(found).catch(() => found),
    realpath2(root).catch(() => root)
  ]);
  const away = relative3(home, real);
  return away.startsWith("..") || isAbsolute2(away) ? null : found;
};
function namedPaths(program) {
  const wanted = /* @__PURE__ */ new Set();
  const want = (node) => {
    if (node === null || node === void 0) return;
    if (node.type === "TemplateLiteral") {
      for (const expression of node.expressions) want(expression);
      return;
    }
    const key = dotted(node);
    if (key !== null) wanted.add(key.split(".")[0]);
  };
  const visit = (node) => {
    if (node.type === "ObjectExpression") {
      for (const property of node.properties) {
        if (property.type !== "ObjectProperty") continue;
        const key = property.key.type === "Identifier" ? property.key.name : property.key.type === "StringLiteral" ? property.key.value : null;
        if (key !== null && PATH_KEYS.has(key)) want(property.value);
      }
    }
    if (node.type === "JSXOpeningElement") {
      for (const attribute of node.attributes) {
        if (attribute.type !== "JSXAttribute" || attribute.name.type !== "JSXIdentifier") continue;
        if (!PATH_KEYS.has(attribute.name.name)) continue;
        if (attribute.value?.type === "JSXExpressionContainer") {
          want(attribute.value.expression);
        }
      }
    }
    for (const child of childNodes(node)) visit(child);
  };
  visit(program);
  return wanted;
}
function dotted(node) {
  if (node.type === "Identifier") return node.name;
  if (node.type !== "MemberExpression" || node.computed) return null;
  const object = dotted(node.object);
  if (object === null) return null;
  const property = node.property.type === "Identifier" ? node.property.name : null;
  return property === null ? null : `${object}.${property}`;
}
function namesScreen(node, names, stopAtNestedRoute) {
  const visit = (current, top) => {
    if (stopAtNestedRoute && !top && current.type === "JSXElement") {
      const tag = current.openingElement.name;
      if (tag.type === "JSXIdentifier" && ROUTE_TAG.test(tag.name)) return false;
    }
    if (current.type === "Identifier" && names.includes(current.name)) return true;
    if (current.type === "JSXIdentifier" && names.includes(current.name)) return true;
    const literal = stringOf(current);
    if (literal !== null && names.some((name) => literal.split(/[/.]/).includes(name))) return true;
    return childNodes(current).some((child) => visit(child, false));
  };
  return visit(node, true);
}
function routeParts(node, constants = NO_CONSTANTS) {
  const own = [];
  let binding = null;
  let children = [];
  const mounted = [];
  for (const property of node.properties) {
    if (property.type !== "ObjectProperty") continue;
    const key = property.key.type === "Identifier" ? property.key.name : property.key.type === "StringLiteral" ? property.key.value : null;
    if (key === null) continue;
    if (PATH_KEYS.has(key)) {
      const written = stringOf(property.value, constants);
      if (written !== null) own.push(written);
    } else if (BINDING_KEYS.has(key)) {
      binding = property.value;
    } else if (CHILD_KEYS.has(key)) {
      const value = property.value;
      if (value.type === "ArrayExpression") {
        children = value.elements.filter((one) => one !== null);
        for (const element of value.elements) {
          if (element !== null && element.type === "SpreadElement") {
            mounted.push(element.argument);
          }
        }
      } else {
        mounted.push(value);
      }
    }
  }
  return { own, binding, children, mounted };
}
function entryFor(node, names, prefix2, absolute = false, constants = NO_CONSTANTS) {
  if (node.type === "ObjectExpression") {
    const { own, binding, children } = routeParts(node, constants);
    const rooted = isRooted(own);
    const here = rooted ? [...own] : [...prefix2, ...own];
    if (binding !== null && namesScreen(binding, names, false)) {
      return { path: joined(here), line: node.loc?.start.line ?? 1, absolute: absolute || rooted };
    }
    for (const child of children) {
      const found = entryFor(child, names, asPrefix(here), absolute || rooted, constants);
      if (found !== null) return found;
    }
    return null;
  }
  if (node.type === "JSXElement") {
    const tag = node.openingElement.name;
    if (tag.type === "JSXIdentifier" && ROUTE_TAG.test(tag.name)) {
      const own = [];
      const bindings = [];
      for (const attribute of node.openingElement.attributes) {
        if (attribute.type !== "JSXAttribute" || attribute.name.type !== "JSXIdentifier") continue;
        const value = attribute.value?.type === "JSXExpressionContainer" ? attribute.value.expression : attribute.value ?? null;
        if (PATH_KEYS.has(attribute.name.name)) {
          const written = stringOf(value, constants);
          if (written !== null) own.push(written);
        } else if (BINDING_KEYS.has(attribute.name.name) && value !== null) {
          bindings.push(value);
        }
      }
      const rooted = isRooted(own);
      const here = rooted ? [...own] : [...prefix2, ...own];
      if (bindings.some((one) => namesScreen(one, names, false)) || namesScreen(node, names, true)) {
        return { path: joined(here), line: node.loc?.start.line ?? 1, absolute: absolute || rooted };
      }
      for (const child of node.children) {
        const found = entryFor(child, names, asPrefix(here), absolute || rooted, constants);
        if (found !== null) return found;
      }
      return null;
    }
  }
  for (const child of childNodes(node)) {
    const found = entryFor(child, names, prefix2, absolute, constants);
    if (found !== null) return found;
  }
  return null;
}
var MAX_MOUNT_READS = 2e4;
var MAX_MOUNT_HOPS = 4;
var MOUNT_FILE = /\.[jt]sx?$/;
var isDistinctive2 = (name) => name.split(/[_$-]+|(?<=[a-z0-9])(?=[A-Z])/).filter((one) => one !== "").length >= 2;
function referencesTable(node, identifier) {
  if (node.type === "Identifier") return node.name === identifier;
  if (node.type === "MemberExpression") {
    return node.property.type === "Identifier" && node.property.name === identifier;
  }
  return false;
}
function tableArrays(program) {
  const found = [];
  const body = program.body ?? [];
  for (const statement of body) {
    const declaration = statement.type === "ExportNamedDeclaration" ? statement.declaration : statement;
    if (declaration !== null && declaration.type === "VariableDeclaration") {
      for (const declarator of declaration.declarations) {
        if (declarator.id.type !== "Identifier") continue;
        if (declarator.init?.type !== "ArrayExpression") continue;
        found.push({ name: declarator.id.name, node: declarator.init });
      }
    } else if (statement.type === "ExportDefaultDeclaration" && statement.declaration.type === "ArrayExpression") {
      found.push({ name: null, node: statement.declaration });
    }
  }
  return found;
}
function mountsIn(node, identifier, prefix2, out) {
  if (node.type === "ObjectExpression") {
    const { own, children, mounted } = routeParts(node);
    const here = [...prefix2, ...own];
    if (mounted.some((one) => referencesTable(one, identifier))) out.push(joined(asPrefix(here)));
    for (const child of children) mountsIn(child, identifier, asPrefix(here), out);
    return;
  }
  for (const child of childNodes(node)) mountsIn(child, identifier, prefix2, out);
}
var sweptFiles = /* @__PURE__ */ new Map();
var foundMounts = /* @__PURE__ */ new Map();
var sources = /* @__PURE__ */ new Map();
var cached = 0;
var MAX_CACHED_BYTES = 32e6;
async function filesUnder(root, budget) {
  const remembered = sweptFiles.get(root);
  if (remembered !== void 0) return remembered;
  const found = [];
  const stack = [root];
  while (stack.length > 0) {
    if (budget.left <= 0) return null;
    budget.left--;
    const dir = stack.pop();
    const entries = await readdir6(dir, { withFileTypes: true }).catch(() => null);
    if (entries === null) continue;
    for (const entry of entries) {
      if (entry.name.startsWith(".") || SKIP_DIR.test(entry.name)) continue;
      const path = join12(dir, entry.name);
      if (entry.isDirectory()) stack.push(path);
      else if (entry.isFile() && MOUNT_FILE.test(entry.name)) found.push(path);
    }
  }
  sweptFiles.set(root, found);
  return found;
}
async function mountsFor(table, identifier, files, budget) {
  const found = /* @__PURE__ */ new Map();
  for (const file of files) {
    const remembered = sources.get(file);
    let source = remembered ?? null;
    if (remembered === void 0) {
      if (budget.left <= 0) return null;
      budget.left--;
      source = await readFile11(file, "utf8").catch(() => null);
      if (source !== null && cached + source.length <= MAX_CACHED_BYTES) {
        sources.set(file, source);
        cached += source.length;
      }
    }
    if (source === null || source.length > MAX_TABLE_BYTES) continue;
    if (!source.includes(identifier)) continue;
    const ast = parseModule(source, file);
    if (ast === null) continue;
    for (const array of tableArrays(ast.program)) {
      if (file === table && array.name === identifier) continue;
      const paths = [];
      mountsIn(array.node, identifier, [], paths);
      for (const path of paths) {
        found.set(`${file}\0${array.name ?? ""}\0${path ?? ""}`, {
          path,
          file,
          binding: array.name
        });
      }
    }
  }
  const mounts = [...found.values()];
  return mounts.length > 1 ? null : mounts;
}
async function mountPrefix(table, identifier, root, reads) {
  if (!isDistinctive2(identifier)) return null;
  const key = `${root}\0${table}\0${identifier}\0${reads}`;
  const remembered = foundMounts.get(key);
  if (remembered !== void 0) return remembered;
  const answer = await climb(table, identifier, root, reads);
  foundMounts.set(key, answer);
  return answer;
}
async function climb(table, identifier, root, reads) {
  const segments = [];
  const seen = /* @__PURE__ */ new Set();
  let from = { file: table, name: identifier };
  for (let hop = 0; hop < MAX_MOUNT_HOPS; hop++) {
    if (from.name === null || !isDistinctive2(from.name)) break;
    const step = `${from.file}\0${from.name}`;
    if (seen.has(step)) break;
    seen.add(step);
    const budget = { left: reads };
    const files = await filesUnder(root, budget);
    if (files === null) return null;
    const mounts = await mountsFor(from.file, from.name, files, budget);
    if (mounts === null) return null;
    if (mounts.length === 0) return hop === 0 ? null : segments;
    const one = mounts[0];
    if (one.path !== null) {
      segments.unshift(...segmentsOf([one.path]));
    }
    from = { file: one.file, name: one.binding };
  }
  return segments.length === 0 ? null : segments;
}
async function placementOf(screen, root, options = {}) {
  return place(screen, root, true, options.mountReads ?? MAX_MOUNT_READS);
}
async function place(screen, root, mounts, mountReads) {
  const nothing = {
    style: null,
    path: null,
    trail: [],
    declaredIn: null,
    pathFromConstant: false
  };
  if (root === null) return nothing;
  const away = relative3(root, screen);
  if (away.startsWith("..") || isAbsolute2(away)) return nothing;
  const byFile = fileRoutedPath(screen, root);
  if (byFile !== null) {
    return {
      style: "file",
      path: `/${byFile.join("/")}`,
      trail: byFile,
      declaredIn: null,
      // The directory *is* the route, so there is no constant to resolve.
      pathFromConstant: false
    };
  }
  const declared = await declaredPath(screen, root);
  if (declared === null) return nothing;
  let path = declared.path;
  if (mounts && declared.binding !== null && !declared.absolute) {
    const prefix2 = await mountPrefix(declared.declaredIn.file, declared.binding, root, mountReads);
    if (prefix2 !== null) {
      path = `/${[...prefix2, ...segmentsOf(path === null ? [] : [path])].join("/")}`;
    }
  }
  return {
    style: "declared",
    path,
    // No path, no trail. Inventing one from the folder is the confident wrong
    // answer this whole module refuses to give.
    trail: segmentsOf(path === null ? [] : [path]),
    pathFromConstant: declared.fromConstant,
    declaredIn: declared.declaredIn
  };
}
var MODULE_EXTENSIONS = [".tsx", ".ts", ".jsx", ".js", ".vue", ".svelte"];
async function resolveRelative(from, spec) {
  if (!spec.startsWith(".")) return null;
  return moduleAt(join12(from, spec));
}
async function moduleAt(base) {
  const isFile2 = (path) => stat6(path).then(
    (info) => info.isFile(),
    () => false
  );
  for (const extension of ["", ...MODULE_EXTENSIONS]) {
    if (await isFile2(`${base}${extension}`)) return `${base}${extension}`;
  }
  for (const extension of MODULE_EXTENSIONS) {
    const inside = join12(base, `index${extension}`);
    if (await isFile2(inside)) return inside;
  }
  return null;
}
async function declaredSiblings(screen, root) {
  if (root === null) return [];
  const placed = await place(screen, root, false, 0);
  if (placed.declaredIn === null) return [];
  const table = placed.declaredIn.file;
  const source = await readFile11(table, "utf8").catch(() => null);
  if (source === null || source.length > MAX_TABLE_BYTES) return [];
  const bound = /* @__PURE__ */ new Set();
  const specifiers = [];
  for (const line of source.split("\n")) {
    if (!BINDS.test(line)) continue;
    for (const name of line.match(/\b[A-Z]\w*/g) ?? []) bound.add(name);
    for (const lazy of line.matchAll(/import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g)) {
      specifiers.push(lazy[1]);
    }
  }
  for (const named2 of source.matchAll(
    /import\s+(?:type\s+)?\{([^}]*)\}\s*from\s*['"`]([^'"`]+)['"`]/g
  )) {
    const names = named2[1].split(",").map((one) => one.trim().split(/\s+as\s+/)[0].trim());
    if (names.some((name) => bound.has(name))) specifiers.push(named2[2]);
  }
  for (const fallback of source.matchAll(
    /import\s+([A-Za-z_$][\w$]*)\s+from\s*['"`]([^'"`]+)['"`]/g
  )) {
    if (bound.has(fallback[1])) specifiers.push(fallback[2]);
  }
  const found = [];
  for (const specifier of specifiers) {
    if (found.length >= MAX_TABLES) break;
    const file = await resolveRelative(dirname5(table), specifier);
    if (file !== null && file !== screen && !found.includes(file)) found.push(file);
  }
  return found;
}

// src/sources/siblings.ts
var ROUTE_FILE = /^(layout|loading|error|not-found|template|default|global-error)\.[jt]sx$/;
var ROUTE_SCREEN2 = /^\+?page\.[jt]sx?$/;
var ownsItsFolder = (target) => {
  const folder = basename6(dirname6(target));
  const bare = basename6(target).replace(/\.[^.]+$/, "");
  return ROUTE_SCREEN2.test(basename6(target)) || /^index$/i.test(bare) || bare === folder || // `crm.component.ts` in `crm/`, and `OrdersPage.module.tsx` in `OrdersPage/`.
  bare.split(".")[0] === folder;
};
var SKIP_DIR2 = /^(node_modules|dist|build|coverage|out|\.next|\.git|__tests__|__mocks__)$/;
var MAX_ANCESTORS = 3;
var MAX_READS2 = 40;
var isScreenFile = (name) => (
  // `.component.ts` is half of an Angular screen — the half that carries the
  // identity — and without it the family of an Angular screen was its templates
  // alone, each with no imports and no name a route could use (#229). Both
  // halves are candidates; `patternOf` folds them back into one screen.
  (/\.(?:[jt]sx|html|vue|svelte)$/.test(name) || /\.component\.[jt]s$/.test(name)) && !/\.(?:test|spec|stories|story)\.(?:[jt]sx?|html|vue|svelte)$/.test(name) && !HOOK_FILE.test(name)
);
var HOOK_FILE = /^use[A-Z]/;
var MAJORITY = 0.6;
var QUORUM = 3;
var MAX_FAMILY = 24;
async function siblingScreens(target, options) {
  const { isScreen, maxSiblings, quorum } = options;
  const readDirectory = options.readDir ?? ((path) => readdir7(path));
  const mine = options.root === void 0 ? /* @__PURE__ */ new Set() : await importedBy(target);
  const notMine = (path) => !mine.has(path);
  if (options.root !== void 0) {
    const declared = (await declaredSiblings(target, options.root)).filter((path) => isScreen(basename6(path)) && notMine(path)).slice(0, maxSiblings);
    if (declared.length >= quorum) return { screens: declared, from: "routes" };
  }
  const dir = dirname6(target);
  const entries = await readDirectory(dir).catch(() => null);
  if (entries === null) return { screens: [], from: "folder" };
  const screen = (name) => isScreen(name) && !ROUTE_FILE.test(name);
  const siblings = entries.filter((name) => screen(name) && name !== basename6(target)).map((name) => join13(dir, name)).filter(notMine).slice(0, maxSiblings);
  if (siblings.length >= quorum && !ownsItsFolder(target)) {
    return { screens: siblings, from: "folder" };
  }
  let budget = MAX_READS2;
  const chooseIn = (folder, name, inside2) => {
    const found = inside2.filter(screen).find((file) => ROUTE_SCREEN2.test(file) || file.startsWith(name) || file.startsWith("index"));
    return found === void 0 ? null : join13(folder, found);
  };
  const collect3 = async (from, depth, into) => {
    if (depth < 0 || into.length >= maxSiblings || budget <= 0) return;
    const entries2 = await readDirectory(from).catch(() => null);
    if (entries2 === null) return;
    budget--;
    for (const name of entries2) {
      if (into.length >= maxSiblings || budget <= 0) return;
      if (screen(name) || SKIP_DIR2.test(name)) continue;
      const folder = join13(from, name);
      if (folder === dir) continue;
      budget--;
      const inside2 = await readDirectory(folder).catch(() => null);
      if (inside2 === null) continue;
      const found = chooseIn(folder, name, inside2);
      if (found !== null) into.push(found);
      await collect3(folder, depth - 1, into);
    }
  };
  const inside = (path) => {
    if (options.root === void 0) return true;
    const away = relative4(options.root, path);
    return away === "" || !away.startsWith("..") && !isAbsolute3(away);
  };
  const scopes = [{ from: dir, depth: 1 }];
  let ancestor = dirname6(dir);
  for (let level = 0; level < MAX_ANCESTORS; level++) {
    if (!inside(ancestor)) break;
    scopes.push({ from: ancestor, depth: level });
    const next = dirname6(ancestor);
    if (next === ancestor) break;
    ancestor = next;
  }
  for (const scope of scopes) {
    const found = [];
    await collect3(scope.from, scope.depth, found);
    const kept = found.filter(notMine);
    if (kept.length >= quorum) return { screens: kept, from: "folder" };
    if (budget <= 0) break;
  }
  return { screens: siblings, from: "folder" };
}
async function importedBy(target) {
  const source = await readFile12(target, "utf8").catch(() => null);
  if (source === null) return /* @__PURE__ */ new Set();
  const ast = parseModule(source, target);
  if (ast === null) return /* @__PURE__ */ new Set();
  const specifiers = [];
  walk(ast.program, (node) => {
    if (node.type === "ImportDeclaration") specifiers.push(node.source.value);
    if (node.type === "CallExpression" && node.callee.type === "Import" && node.arguments[0]?.type === "StringLiteral") {
      specifiers.push(node.arguments[0].value);
    }
  });
  const found = /* @__PURE__ */ new Set();
  for (const specifier of specifiers) {
    const path = await resolveRelative(dirname6(target), specifier);
    if (path !== null) found.add(path);
  }
  return found;
}
var MAX_HOLDER_READS = 600;
var MAX_HOLDER_SWEEP = 8e3;
async function holderSiblings(target, holder, area, options) {
  if (holder === "" || /^[a-z]/.test(holder)) return [];
  const swept = await filesUnder(area, { left: MAX_HOLDER_SWEEP });
  if (swept === null) return [];
  const budget = { left: MAX_HOLDER_READS };
  const mine = await importedBy(target);
  const found = [];
  const needle = `<${holder}`;
  for (const path of swept) {
    if (found.length >= options.maxSiblings || budget.left <= 0) break;
    if (path === target || mine.has(path)) continue;
    if (!options.isScreen(basename6(path)) || ROUTE_FILE.test(basename6(path))) continue;
    budget.left--;
    const source = await readFile12(path, "utf8").catch(() => null);
    if (source === null || !source.includes(needle)) continue;
    found.push(path);
  }
  return found;
}

// src/sources/pair.ts
import { readFile as readFile13, stat as stat7 } from "node:fs/promises";
import { dirname as dirname7, resolve as resolve5 } from "node:path";
var CLASS_FILE = /\.component\.[jt]s$/;
var TEMPLATE_FILE = /\.html$/;
var DECORATED = /@Component\s*\(/;
var TEMPLATE_URL = /templateUrl\s*:\s*['"`]([^'"`]+)['"`]/;
var INLINE = /template\s*:\s*`([\s\S]*?)`/;
var SELECTOR = /selector\s*:\s*['"`]([^'"`]+)['"`]/;
var MAX_BYTES = 4e5;
var isFile = (path) => stat7(path).then(
  (info) => info.isFile(),
  () => false
);
async function pairOf(path) {
  if (CLASS_FILE.test(path)) {
    const source = await readFile13(path, "utf8").catch(() => null);
    if (source === null || source.length > MAX_BYTES || !DECORATED.test(source)) return null;
    const url = TEMPLATE_URL.exec(source)?.[1];
    if (url !== void 0) {
      const markup = resolve5(dirname7(path), url);
      if (await isFile(markup)) return { identity: path, markup, inline: null };
    }
    const inline = INLINE.exec(source)?.[1];
    if (inline !== void 0) return { identity: path, markup: null, inline };
    return null;
  }
  if (!TEMPLATE_FILE.test(path)) return null;
  for (const extension of [".ts", ".js"]) {
    const identity = path.replace(TEMPLATE_FILE, extension);
    if (!await isFile(identity)) continue;
    const source = await readFile13(identity, "utf8").catch(() => null);
    if (source === null || !DECORATED.test(source)) continue;
    return { identity, markup: path, inline: null };
  }
  return null;
}
async function markupOf(path, fallback) {
  const pair = await pairOf(path);
  if (pair === null) return { path, source: fallback };
  if (pair.inline !== null) return { path: `${pair.identity}.html`, source: pair.inline };
  if (pair.markup === null) return { path, source: fallback };
  const source = await readFile13(pair.markup, "utf8").catch(() => null);
  return source === null ? { path, source: fallback } : { path: pair.markup, source };
}
async function selectorOf(path) {
  const source = await readFile13(path, "utf8").catch(() => null);
  if (source === null || source.length > MAX_BYTES || !DECORATED.test(source)) return null;
  const selector = SELECTOR.exec(source)?.[1] ?? null;
  return selector !== null && /^[a-z][\w-]*$/i.test(selector) ? selector : null;
}

// src/sources/neighbours.ts
var CHECKABLE = /\.(?:[jt]sx|html|vue|svelte)$/;
var PAIRED = /\.component\.[jt]s$/;
var GENERATED2 = /\.(?:test|spec|stories|story)\.(?:[jt]sx?|html|vue|svelte)$/;
function neighbourSource() {
  return {
    kind: "neighbours",
    async describe(target) {
      const root = await findProjectRoot(dirname8(target));
      const family = await siblingScreens(target, {
        ...root === null ? {} : { root },
        isScreen: (name) => (CHECKABLE.test(name) || PAIRED.test(name)) && !GENERATED2.test(name),
        maxSiblings: MAX_FAMILY,
        quorum: QUORUM
      });
      const siblings = family.screens;
      if (siblings.length < QUORUM) return null;
      const seen = /* @__PURE__ */ new Map();
      const patterns2 = [];
      const holders = /* @__PURE__ */ new Map();
      let read = 0;
      const seenPairs = /* @__PURE__ */ new Set();
      for (const path of siblings) {
        const own = await readFile14(path, "utf8").catch(() => null);
        if (own === null) continue;
        const pair = await pairOf(path).catch(() => null);
        if (pair !== null && seenPairs.has(pair.identity)) continue;
        if (pair !== null) seenPairs.add(pair.identity);
        const markup = pair === null ? { path, source: own } : await markupOf(pair.identity, own);
        const shape = shapeOf(markup.source, templateKind(markup.path) ?? void 0);
        if (shape === null) continue;
        read++;
        for (const component of new Set(shape.components)) {
          seen.set(component, (seen.get(component) ?? 0) + 1);
        }
        if (shape.pattern.length > 0) patterns2.push(shape.pattern);
        if (shape.holder !== null) holders.set(shape.holder, (holders.get(shape.holder) ?? 0) + 1);
      }
      if (read < QUORUM) return null;
      const components = [...seen.entries()].filter(([, count]) => count / read >= MAJORITY).sort((a, b) => b[1] - a[1]).map(([name]) => name);
      if (components.length === 0) return null;
      const counted2 = /* @__PURE__ */ new Map();
      for (const pattern3 of patterns2) {
        const key = pattern3.join(">");
        counted2.set(key, (counted2.get(key) ?? 0) + 1);
      }
      const [best] = [...counted2.entries()].sort((a, b) => b[1] - a[1]);
      const pattern2 = best !== void 0 && best[1] / read >= MAJORITY ? best[0].split(">") : [];
      const [commonest2] = [...holders.entries()].sort((a, b) => b[1] - a[1]);
      const holder = commonest2 !== void 0 && commonest2[1] / read >= MAJORITY ? commonest2[0] : void 0;
      return {
        kind: "neighbours",
        components,
        pattern: pattern2,
        ...holder === void 0 ? {} : { holder },
        // Never prop conventions. What the siblings pass is what happens to be
        // there, and a value repeated by copy-paste is not a rule — this is
        // exactly the inference the project refuses to make.
        props: {},
        heuristic: true
      };
    }
  };
}

// src/sources/usage.ts
import { readFile as readFile15 } from "node:fs/promises";
import { dirname as dirname9 } from "node:path";

// src/sources/names.ts
var trailingWord = (name) => {
  const words = name.includes("-") ? name.split("-") : name.match(/[A-Z][a-z0-9]*/g);
  const last = words?.[words.length - 1];
  return last === void 0 || last.length < 3 ? null : last;
};

// src/sources/usage.ts
var CHECKABLE2 = /\.(?:[jt]sx|html|vue|svelte)$/;
var PAIRED2 = /\.component\.[jt]s$/;
var GENERATED3 = /\.(?:test|spec|stories|story)\.(?:[jt]sx?|html|vue|svelte)$/;
var MIN_FILES = 3;
var MAX_COMPONENTS = 8;
var MAX_PROPS = 6;
var MAX_CLASSES = 8;
var NOISE = /^(?:key|ref|id)$|^(?:data-|aria-describedby)/;
var BINDING = /^[[(:@#*]|^v-/;
var CLASS_ATTRS = /* @__PURE__ */ new Set(["class", "classname"]);
var EXPRESSION = /[{}]/;
var isComponent = (name) => /^[A-Z]/.test(name) || name.includes("-");
var attributeValue = (attribute) => {
  const value = attribute.value;
  const literal = (text, bare = false) => ({ value: text, bare, shape: "literal" });
  if (value === null || value === void 0) return literal("true", true);
  if (value.type === "StringLiteral") return literal(value.value);
  if (value.type === "JSXExpressionContainer") {
    const inner = value.expression;
    if (inner.type === "BooleanLiteral") return literal(String(inner.value));
    if (inner.type === "NumericLiteral") return literal(String(inner.value));
    if (inner.type === "StringLiteral") return literal(inner.value);
    return { value: null, bare: false, shape: inner.type === "CallExpression" ? "call" : "expression" };
  }
  return { value: null, bare: false, shape: "expression" };
};
var usageNameOf = (element) => {
  const name = element.openingElement.name;
  if (name.type === "JSXIdentifier") return name.name;
  if (name.type === "JSXMemberExpression" && name.property.type === "JSXIdentifier") {
    const object = name.object;
    if (object.type !== "JSXIdentifier") return null;
    return `${object.name}.${name.property.name}`;
  }
  return null;
};
var tokens = (value) => new Set(value.split(/\s+/).filter((token) => token !== ""));
var fromJsx2 = (source, all) => {
  const ast = parseModule(source);
  if (ast === null) return [];
  const written = [];
  walk(ast.program, (node) => {
    if (node.type !== "JSXElement") return;
    const name = usageNameOf(node);
    if (name === null || !isComponent(name)) return;
    const attributes = /* @__PURE__ */ new Map();
    let classes = null;
    let classAttribute = null;
    for (const attribute of node.openingElement.attributes) {
      if (attribute.type !== "JSXAttribute") continue;
      if (attribute.name.type !== "JSXIdentifier") continue;
      const key = attribute.name.name;
      const value = attributeValue(attribute);
      if (CLASS_ATTRS.has(key.toLowerCase())) {
        if (value.value === null) continue;
        const found = tokens(value.value);
        classes = classes === null ? found : intersect(classes, found);
        classAttribute ??= key;
        continue;
      }
      if (!all && NOISE.test(key)) continue;
      attributes.set(key, value);
    }
    written.push({ component: name, attributes, classes, classAttribute });
  });
  return written;
};
var fromTemplate2 = (source, path, all) => {
  const kind = templateKind(path);
  if (kind === null) return [];
  const written = [];
  for (const node of parseTemplate(source, kind)) {
    if (!isComponent(node.name)) continue;
    const attributes = /* @__PURE__ */ new Map();
    let classes = null;
    let classAttribute = null;
    for (const [key, value] of Object.entries(node.attributes)) {
      if (CLASS_ATTRS.has(key.toLowerCase())) {
        const found = new Set([...tokens(value)].filter((token) => !EXPRESSION.test(token)));
        classes = classes === null ? found : intersect(classes, found);
        classAttribute ??= key;
        continue;
      }
      if (BINDING.test(key) || !all && NOISE.test(key)) continue;
      if (EXPRESSION.test(value)) continue;
      attributes.set(
        key,
        value === "" ? { value: "true", bare: true, shape: "literal" } : { value, bare: false, shape: "literal" }
      );
    }
    written.push({ component: node.name, attributes, classes, classAttribute });
  }
  return written;
};
var intersect = (left, right) => new Set([...left].filter((item) => right.has(item)));
var perFile = (written) => {
  const byComponent = /* @__PURE__ */ new Map();
  for (const one of written) {
    const existing = byComponent.get(one.component);
    if (existing === void 0) {
      byComponent.set(one.component, one);
      continue;
    }
    for (const [key, written2] of existing.attributes) {
      const other = one.attributes.get(key);
      if (other === void 0 || other.shape !== written2.shape || other.value !== written2.value || other.value === null && written2.value === null && other !== written2) {
        existing.attributes.delete(key);
        continue;
      }
      if (!other.bare) written2.bare = false;
    }
    existing.classes = existing.classes === null || one.classes === null ? null : intersect(existing.classes, one.classes);
    existing.classAttribute ??= one.classAttribute;
  }
  return byComponent;
};
var writtenIn = (path, source, options = {}) => templateKind(path) === null ? fromJsx2(source, options.all ?? false) : fromTemplate2(source, path, options.all ?? false);
var observeUsage = async (target, options = {}) => {
  const read = options.readSource ?? ((path) => readFile15(path, "utf8").catch(() => null));
  const root = options.readDir === void 0 ? await findProjectRoot(dirname9(target)) : null;
  const siblings = options.family ?? (await siblingScreens(target, {
    ...options.readDir === void 0 ? {} : { readDir: options.readDir },
    ...root === null ? {} : { root },
    isScreen: (name) => (CHECKABLE2.test(name) || PAIRED2.test(name)) && !GENERATED3.test(name),
    maxSiblings: MAX_FAMILY,
    quorum: QUORUM
  })).screens;
  if (siblings.length < QUORUM) return null;
  const files = [];
  const seen = /* @__PURE__ */ new Set();
  for (const path of siblings) {
    const source = await read(path);
    if (source === null) continue;
    const pair = options.readSource === void 0 ? await pairOf(path) : null;
    if (pair !== null && seen.has(pair.identity)) continue;
    if (pair !== null) seen.add(pair.identity);
    const markup = pair === null ? { path, source } : await markupOf(pair.identity, source);
    const written = writtenIn(markup.path, markup.source, { all: true });
    if (written.length === 0) continue;
    files.push(perFile(written));
  }
  if (files.length < QUORUM) return null;
  const usages = [];
  const components = new Set(files.flatMap((file) => [...file.keys()]));
  for (const slot of slotsIn(files)) components.add(slot);
  for (const component of components) {
    const uses = files.map((file) => file.get(component)).filter((one) => one !== void 0);
    if (uses.length < MIN_FILES || uses.length / files.length < MAJORITY) continue;
    const values = /* @__PURE__ */ new Map();
    for (const use of uses) {
      for (const [key, written2] of use.attributes) {
        const entry = values.get(key) ?? {
          seen: /* @__PURE__ */ new Set(),
          shapes: /* @__PURE__ */ new Set(),
          bare: true,
          unknown: 0
        };
        if (written2.value === null) entry.unknown++;
        else entry.seen.add(written2.value);
        entry.shapes.add(written2.shape);
        entry.bare = entry.bare && written2.bare;
        values.set(key, entry);
      }
    }
    let agreedBy = uses.length;
    const agreed2 = [];
    const always = [];
    for (const [name, entry] of values) {
      const writtenBy = uses.filter((use) => use.attributes.has(name)).length;
      if (entry.seen.size === 1 && entry.unknown === 0 && !NOISE.test(name)) {
        if (writtenBy < MIN_FILES || writtenBy / uses.length < MAJORITY) continue;
        agreed2.push({ name, value: [...entry.seen][0], bare: entry.bare, writtenBy });
        continue;
      }
      if (writtenBy < MIN_FILES || writtenBy / uses.length < MAJORITY) continue;
      always.push({
        name,
        // The shape is a claim about the screens that write it at all, so it is
        // read over those and not over the whole family.
        shape: entry.shapes.size === 1 ? [...entry.shapes][0] : null,
        writtenBy
      });
    }
    const props2 = agreed2.sort((a, b) => b.writtenBy - a.writtenBy).slice(0, MAX_PROPS);
    for (const prop of props2) agreedBy = Math.min(agreedBy, prop.writtenBy);
    const counted2 = /* @__PURE__ */ new Map();
    for (const use of uses) {
      for (const token of use.classes ?? []) counted2.set(token, (counted2.get(token) ?? 0) + 1);
    }
    const classes = [...counted2.entries()].filter(([, count]) => count / uses.length >= MAJORITY && count >= MIN_FILES).sort((a, b) => b[1] - a[1]).slice(0, MAX_CLASSES);
    for (const [, count] of classes) agreedBy = Math.min(agreedBy, count);
    const classAttribute = uses.find((use) => use.classAttribute !== null)?.classAttribute ?? null;
    const written = always.sort((a, b) => b.writtenBy - a.writtenBy || a.name.localeCompare(b.name)).slice(0, MAX_PROPS);
    if (props2.length === 0 && classes.length === 0 && written.length === 0) continue;
    usages.push({
      component,
      props: props2.map(({ name, value, bare }) => ({ name, value, bare })),
      written,
      classes: classes.map(([token]) => token),
      classAttribute,
      seenIn: uses.length,
      agreedBy
    });
  }
  if (usages.length === 0) return null;
  return usages.sort((a, b) => b.seenIn - a.seenIn).slice(0, MAX_COMPONENTS);
};
function slotsIn(files) {
  const carries = (name) => {
    const count = files.filter((file) => file.has(name)).length;
    return count >= MIN_FILES && count / files.length >= MAJORITY;
  };
  const byWord = /* @__PURE__ */ new Map();
  for (const file of files) {
    for (const name of file.keys()) {
      if (name.startsWith("*") || carries(name)) continue;
      const word = trailingWord(name);
      if (word === null) continue;
      const names = byWord.get(word) ?? /* @__PURE__ */ new Set();
      names.add(name);
      byWord.set(word, names);
    }
  }
  const added = [];
  for (const [word, names] of byWord) {
    if (names.size < 2) continue;
    const slot = `*${word}`;
    for (const file of files) {
      const mine = [...names].flatMap((name) => {
        const one = file.get(name);
        return one === void 0 ? [] : [{ ...one, component: slot }];
      });
      if (mine.length === 0) continue;
      const merged = perFile(mine).get(slot);
      if (merged !== void 0) file.set(slot, merged);
    }
    added.push(slot);
  }
  return added;
}

// src/sources/pattern.ts
import { readFile as readFile18, stat as stat9 } from "node:fs/promises";
import { dirname as dirname11, join as join16, relative as relative6, resolve as resolve6 } from "node:path";

// src/knowledge/pattern-file.ts
import { readdir as readdir8, readFile as readFile16, stat as stat8 } from "node:fs/promises";
import { join as join14 } from "node:path";
var MEMBERS = /^where it is used$|^used (?:by|in)$/i;
var RULES = /^rules?$/i;
var STRUCTURE = /^structure$/i;
var PROPS = /^props$/i;
async function patternFiles(rootDir) {
  const { dir, legacy } = await knowledgeDir(rootDir, "patterns");
  const entries = await readdir8(dir).catch(() => null);
  if (entries === null) return { patterns: [], legacy };
  const patterns2 = [];
  for (const entry of entries.filter((name) => name.endsWith(".md")).sort()) {
    const raw = await readFile16(join14(dir, entry), "utf8").catch(() => null);
    if (raw === null) continue;
    patterns2.push(parsePattern(entry, raw));
  }
  return { patterns: patterns2, legacy };
}
function parsePattern(file, raw) {
  const { front, body } = splitFrontmatter(raw);
  const sections = /* @__PURE__ */ new Map();
  let current = null;
  let lines = [];
  const keep = () => {
    if (current !== null) sections.set(current, lines.join("\n").trim());
  };
  for (const line of body.split("\n")) {
    const heading = /^##\s+(.+?)\s*$/.exec(line);
    if (heading !== null) {
      keep();
      current = heading[1] ?? "";
      lines = [];
      continue;
    }
    lines.push(line);
  }
  keep();
  const named2 = (test) => {
    for (const [title2, text] of sections) if (test.test(title2)) return text;
    return null;
  };
  return {
    file,
    name: front.get("pattern") ?? file.replace(/\.md$/, ""),
    surface: front.get("surface") ?? null,
    holder: front.get("holder") ?? null,
    observed: front.get("observed") ?? null,
    derived: /^(true|yes)$/i.test(front.get("derived") ?? ""),
    structure: parseStructure(named2(STRUCTURE)),
    props: parseProps(named2(PROPS)),
    members: parseMembers(named2(MEMBERS)),
    sections,
    rules: (named2(RULES) ?? "").split("\n").flatMap((line) => {
      const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
      return bullet === null ? [] : [bullet[1].trim()];
    }).filter((rule) => rule.length > 0)
  };
}
function splitFrontmatter(raw) {
  const front = /* @__PURE__ */ new Map();
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(raw);
  if (match === null) return { front, body: raw };
  for (const line of (match[1] ?? "").split("\n")) {
    const pair = /^([\w-]+)\s*:\s*(.*)$/.exec(line);
    if (pair !== null) front.set(pair[1], pair[2].trim());
  }
  return { front, body: raw.slice(match[0].length) };
}
function parseStructure(text) {
  if (text === null) return [];
  const fenced = /```[^\n]*\n([\s\S]*?)```/.exec(text);
  const block = fenced?.[1] ?? text;
  return block.split("\n").flatMap((line) => {
    if (line.trim().length === 0) return [];
    const indent = Math.floor((/^ */.exec(line)?.[0].length ?? 0) / 2);
    const [name, ...rest] = line.trim().split(/\s{2,}/);
    if (name === void 0 || name.length === 0) return [];
    const strength = rest.join("  ").trim();
    return [{ indent, name, strength: strength.length === 0 ? null : strength }];
  });
}
function parseMembers(text) {
  if (text === null) return [];
  const found = /* @__PURE__ */ new Set();
  for (const match of text.matchAll(/`([^`]+)`|(?:^|[\s,])([\w./-]+\.\w+)(?=[\s,.]|$)/gm)) {
    const path = (match[1] ?? match[2] ?? "").trim();
    if (path.includes(".") && !path.startsWith("#")) found.add(path);
  }
  return [...found];
}
function patternForScreen(patterns2, file, holder) {
  const named2 = patterns2.filter((one) => one.members.includes(file));
  if (named2.length === 1) return named2[0];
  if (named2.length > 1) return null;
  if (holder === null) return null;
  const byHolder = patterns2.filter((one) => one.holder === holder);
  return byHolder.length === 1 ? byHolder[0] : null;
}
async function staleIn(rootDir, pattern2) {
  if (pattern2.observed === null) return [];
  const observed = Date.parse(pattern2.observed);
  if (Number.isNaN(observed)) return [];
  const until = observed + 24 * 60 * 60 * 1e3;
  const moved = [];
  for (const member of pattern2.members) {
    const info = await stat8(join14(rootDir, member)).catch(() => null);
    if (info === null) moved.push({ file: member, why: "gone" });
    else if (info.mtimeMs > until) moved.push({ file: member, why: "changed" });
  }
  return moved;
}
function parseProps(text) {
  if (text === null) return [];
  const found = [];
  let current = null;
  for (const line of text.split("\n")) {
    const heading = /^###\s+`?([^`\s]+)`?\s*$/.exec(line);
    if (heading !== null) {
      current = { component: heading[1], props: [] };
      found.push(current);
      continue;
    }
    if (current === null) continue;
    const bullet = /^\s*[-*]\s+`([^`]+)`\s*(.*)$/.exec(line);
    if (bullet === null) continue;
    const rest = bullet[2] ?? "";
    const value = /^=\s*"([^"]*)"/.exec(rest.trim())?.[1] ?? null;
    const strength = rest.replace(/^=\s*"[^"]*"/, "").replace(/^\s*[—-]\s*/, "").trim();
    const counted2 = /^(\d+)\s+of\s+(\d+)$/.exec(strength);
    current.props.push({
      name: bullet[1],
      value,
      strength: strength.length === 0 ? null : strength,
      writtenBy: counted2 === null ? null : Number(counted2[1]),
      of: counted2 === null ? null : Number(counted2[2])
    });
  }
  return found;
}

// src/sources/layouts.ts
import { readdir as readdir9, readFile as readFile17 } from "node:fs/promises";
import { dirname as dirname10, isAbsolute as isAbsolute4, join as join15, relative as relative5 } from "node:path";
var LAYOUT_FILE = /^(\+layout\.svelte|layout\.[jt]sx?|__layout\.svelte)$/;
async function governingLayout(screen, root) {
  const inside = (path) => {
    if (root === null) return true;
    const away = relative5(root, path);
    return away === "" || !away.startsWith("..") && !isAbsolute4(away);
  };
  let dir = dirname10(screen);
  for (; ; ) {
    if (!inside(dir)) return null;
    const entries = await readdir9(dir).catch(() => null);
    const found = entries?.find((name) => LAYOUT_FILE.test(name));
    if (found !== void 0 && join15(dir, found) !== screen) return join15(dir, found);
    const parent = dirname10(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}
async function chromeOf(path) {
  const source = await readFile17(path, "utf8").catch(() => null);
  if (source === null) return null;
  const kind = templateKind(path);
  const names = kind === null ? namesInJsx(source) : parseTemplate(source, kind).map((node) => node.name);
  const regions = [];
  for (const name of names) {
    const region = regionOf(name, names[0]);
    if (region !== null && !regions.includes(region)) regions.push(region);
  }
  if (regions.length === 0) return null;
  return { file: path, provides: regions };
}
function namesInJsx(source) {
  const ast = parseModule(source);
  if (ast === null) return [];
  const names = [];
  walk(ast.program, (node) => {
    if (node.type !== "JSXElement") return;
    const name = jsxNameOf(node);
    if (name !== null) names.push(name);
  });
  return names;
}

// src/sources/pattern.ts
var MIN_FAMILY = QUORUM;
var rolesOf = (reading) => reading.page.order.map((one) => one.region);
function commonest(values) {
  const counted2 = /* @__PURE__ */ new Map();
  for (const value of values) counted2.set(value, (counted2.get(value) ?? 0) + 1);
  const [best] = [...counted2.entries()].sort((a, b) => b[1] - a[1]);
  return best === void 0 ? null : { value: best[0], count: best[1] };
}
function shared(perScreen) {
  const counted2 = /* @__PURE__ */ new Map();
  for (const screen of perScreen) {
    for (const value of new Set(screen)) counted2.set(value, (counted2.get(value) ?? 0) + 1);
  }
  return [...counted2.entries()].filter(([, count]) => count / perScreen.length >= MAJORITY).sort((a, b) => b[1] - a[1]).map(([value]) => value);
}
function vocabularyOf(screens) {
  const byRole = /* @__PURE__ */ new Map();
  for (const screen of screens) {
    const seen = /* @__PURE__ */ new Set();
    for (const filled of screen.page.order) {
      if (seen.has(filled.region)) continue;
      seen.add(filled.region);
      byRole.set(filled.region, [...byRole.get(filled.region) ?? [], filled.component]);
    }
  }
  const vocabulary = [];
  for (const [role, components] of byRole) {
    const best = commonest(components);
    if (best === null || best.count / screens.length < MAJORITY) continue;
    vocabulary.push({ role, component: best.value });
  }
  return vocabulary;
}
var HOOK = /^use[A-Z]/;
function hooksIn(source) {
  const ast = parseModule(source);
  if (ast === null) return [];
  const found = /* @__PURE__ */ new Set();
  walk(ast.program, (node) => {
    if (node.type !== "CallExpression") return;
    if (node.callee.type !== "Identifier") return;
    if (HOOK.test(node.callee.name)) found.add(node.callee.name);
  });
  return [...found];
}
var REPLACEABLE = /* @__PURE__ */ new Set([
  "button",
  "input",
  "textarea",
  "select",
  "table",
  "dialog",
  "form",
  "a"
]);
async function readScreen(path) {
  const pair = await pairOf(path);
  const identity = pair?.identity ?? path;
  const own = await readFile18(identity, "utf8").catch(() => null);
  if (own === null) return null;
  const markup = pair === null ? { path, source: own } : await markupOf(identity, own);
  const source = markup.source;
  const kind = templateKind(markup.path);
  const page = kind === null ? regionsOf(source) : regionsOf(source, kind);
  if (page === null) return null;
  if (kind !== null) {
    const nodes = parseTemplate(source, kind);
    return {
      path: identity,
      page,
      components: [...new Set(nodes.map((node) => node.name).filter(isTemplateComponent))],
      intrinsics: [...new Set(nodes.map((node) => node.name))].filter(
        (name) => REPLACEABLE.has(name)
      ),
      hooks: [],
      body: bodyIn(nodes, page.holder)
    };
  }
  const shape = shapeOf(source);
  return {
    path: identity,
    page,
    components: shape?.components ?? [],
    intrinsics: (rawMarkupOf(source) ?? []).filter((name) => REPLACEABLE.has(name)),
    hooks: hooksIn(source),
    body: shape?.body ?? []
  };
}
function bodyIn(nodes, holder) {
  const at = nodes.findIndex((node) => node.name === holder);
  if (at < 0) return [];
  const depth = nodes[at].depth;
  const body = [];
  for (const node of nodes.slice(at + 1)) {
    if (node.depth <= depth) break;
    if (node.depth === depth + 1 && isTemplateComponent(node.name)) body.push(node.name);
  }
  return body;
}
function bodyOf(screens) {
  const bodies = screens.map((one) => one.body);
  if (bodies.some((body) => body.length === 0)) return null;
  const children = bodies[0].length;
  if (!bodies.every((body) => body.length === children)) return null;
  const first = bodies.map((body) => body[0]);
  const component = first.every((name) => name === first[0]) ? first[0] : null;
  const words = first.map(trailingWord);
  const shared2 = words[0] ?? null;
  const suffix = shared2 !== null && words.every((word) => word === shared2) && component === null ? shared2 : null;
  return { children, component, suffix };
}
function skeletonOf(screens) {
  const holder = commonest(screens.map((one) => one.page.holder));
  if (holder === null || holder.count / screens.length < MAJORITY) return null;
  const orders = screens.filter((one) => one.page.holder === holder.value).map((one) => rolesOf(one).join(">"));
  const order = commonest(orders);
  if (order === null || order.count / orders.length < MAJORITY) return null;
  return {
    holder: holder.value,
    regions: order.value === "" ? [] : order.value.split(">")
  };
}
async function patternOf2(target, options = {}) {
  const root = await findProjectRoot(dirname11(target));
  const named2 = root === null ? null : await familyFromPattern(root, target, options.ignoringPattern);
  const family = named2 ?? await siblingScreens(target, {
    ...root === null ? {} : { root },
    isScreen: isScreenFile,
    maxSiblings: MAX_FAMILY,
    // The reference counts towards the quorum: three screens of a kind is a
    // family, and one of the three is the page being asked about.
    quorum: MIN_FAMILY - 1
  });
  const readAll = async (paths) => {
    const out = [];
    const seen = /* @__PURE__ */ new Set();
    for (const path of [target, ...paths]) {
      const reading = await readScreen(path);
      if (reading === null || seen.has(reading.path)) continue;
      seen.add(reading.path);
      out.push(reading);
    }
    return out;
  };
  let from = family.from;
  let read = await readAll(family.screens);
  if (read.length < MIN_FAMILY) return null;
  const asked = (await pairOf(target))?.identity ?? target;
  const asking = read.find((one) => one.path === asked);
  if (asking === void 0) return null;
  let reference = asking;
  let sameHolder = read.filter((one) => one.page.holder === reference.page.holder);
  if (options.byHolder === true && sameHolder.length < MIN_FAMILY && root !== null && named2 === null) {
    const area = await appRootFor(target, root);
    const byHolder = area === null ? [] : await holderSiblings(target, reference.page.holder, area, {
      isScreen: isScreenFile,
      maxSiblings: MAX_FAMILY
    });
    if (byHolder.length + 1 >= MIN_FAMILY) {
      const again = await readAll(byHolder);
      const held = again.filter((one) => one.page.holder === reference.page.holder);
      const still = again.find((one) => one.path === asked);
      if (held.length >= MIN_FAMILY && still !== void 0) {
        read = again;
        sameHolder = held;
        reference = still;
        from = "holder";
      }
    }
  }
  const narrowed = sameHolder.length >= MIN_FAMILY;
  if (!narrowed && from === "folder") return null;
  const screens = narrowed ? sameHolder : read;
  const kind = narrowed ? reference.page.holder : null;
  const others = screens.filter((one) => one !== reference);
  const elsewhereRoles = new Set(others.flatMap(rolesOf));
  const elsewhereComponents = new Set(others.flatMap((one) => one.components));
  const observed = await observeUsage(target, { family: others.map((one) => one.path) }).catch(
    () => null
  );
  const fromMarkup = screens.filter((one) => /^[a-z][\w]*$/.test(one.page.holder)).length;
  const built = fromMarkup / screens.length >= MAJORITY ? "markup" : "components";
  const rendered = new Set(screens.flatMap((one) => one.intrinsics));
  const avoids = [...REPLACEABLE].filter((name) => !rendered.has(name));
  const layouts = await Promise.all(screens.map((one) => governingLayout(one.path, root)));
  const agreed2 = commonest(layouts.filter((path) => path !== null));
  const chrome = agreed2 === null || agreed2.count / screens.length < MAJORITY ? null : await chromeOf(agreed2.value);
  const skeleton = skeletonOf(screens);
  if (family.from === "folder" && skeleton !== null && skeleton.holder !== reference.page.holder) {
    return null;
  }
  const vocabulary = vocabularyOf(screens);
  const body = bodyOf(screens);
  const holderIsWritten = (observed ?? []).some(
    (one) => one.component === skeleton?.holder && (one.props.length > 0 || one.written.length > 0 || one.classes.length > 0)
  );
  return {
    skeleton,
    vocabulary,
    regionsIn: skeleton === null ? null : skeleton.regions.length > 0 ? "components" : holderIsWritten ? "holder" : null,
    body,
    configuration: observed ?? [],
    propsUnmeasured: observed === null ? { siblings: others.length, needed: QUORUM } : null,
    particulars: {
      roles: [...new Set(rolesOf(reference))].filter((role) => !elsewhereRoles.has(role)),
      components: reference.components.filter((name) => !elsewhereComponents.has(name))
    },
    chrome,
    avoids,
    built,
    wiring: shared(screens.map((one) => one.hooks)),
    family: screens.map((one) => one.path),
    kind,
    from
  };
}
async function familyFromPattern(root, target, ignoring) {
  const { patterns: patterns2 } = await patternFiles(root).catch(() => ({ patterns: [] }));
  if (patterns2.length === 0) return null;
  const where2 = relative6(root, target);
  const covering = patterns2.find(
    (one) => one.name !== ignoring && one.members.includes(where2)
  );
  if (covering === void 0) return null;
  const screens = covering.members.filter((member) => member !== where2).map((member) => resolve6(root, member));
  return screens.length + 1 < MIN_FAMILY ? null : { screens, from: "pattern" };
}
async function appRootFor(screen, root) {
  let current = dirname11(screen);
  for (; ; ) {
    if (await stat9(join16(current, "package.json")).then(() => true, () => false)) return current;
    if (current === root) return null;
    const up = dirname11(current);
    if (up === current) return null;
    current = up;
  }
}

// src/sources/tree.ts
import { readFile as readFile19 } from "node:fs/promises";
import { relative as relative7 } from "node:path";

// src/sources/resolve.ts
import { dirname as dirname12, join as join17, resolve as resolve7, sep as sep4 } from "node:path";
async function resolverFor(rootDir) {
  const aliases = await tsconfigPaths(rootDir).catch(() => null);
  const packages = await cachedPackages(rootDir).catch(() => []);
  const byLongestName = [...packages].sort((a, b) => b.name.length - a.name.length);
  return {
    find: (fromFile, specifier) => resolveIn(rootDir, aliases, byLongestName, fromFile, specifier),
    shape: (specifier) => {
      if (specifier.startsWith(".")) return "relative";
      if (Object.keys(aliases?.paths ?? {}).some((p) => matchAlias(p, specifier) !== null)) {
        return "aliased";
      }
      return packageFor(byLongestName, specifier) === null ? "package" : "workspace";
    },
    packageOf: (file) => {
      const owning = [...packages].sort((a, b) => b.root.length - a.root.length).find((one) => contains(one.root, file));
      return owning?.name ?? null;
    }
  };
}
async function resolveIn(rootDir, aliases, packages, fromFile, specifier) {
  const found = specifier.startsWith(".") ? await resolveRelative(dirname12(fromFile), specifier) : await throughAliases(aliases, specifier) ?? await throughPackages(packages, specifier);
  if (found === null) return null;
  if (found.split(sep4).includes("node_modules")) return null;
  return await insideProject(rootDir, found) ? found : null;
}
async function throughAliases(aliases, specifier) {
  if (aliases === null) return null;
  const matches2 = Object.keys(aliases.paths).filter((pattern2) => matchAlias(pattern2, specifier) !== null).sort((a, b) => b.length - a.length);
  for (const pattern2 of matches2) {
    const rest = matchAlias(pattern2, specifier);
    if (rest === null) continue;
    for (const target of aliases.paths[pattern2] ?? []) {
      const found = await moduleAt(resolve7(aliases.baseUrl, target.replace("*", rest)));
      if (found !== null) return found;
    }
  }
  return null;
}
function matchAlias(pattern2, specifier) {
  const star = pattern2.indexOf("*");
  if (star === -1) return pattern2 === specifier ? "" : null;
  const before = pattern2.slice(0, star);
  const after = pattern2.slice(star + 1);
  if (!specifier.startsWith(before) || !specifier.endsWith(after)) return null;
  if (specifier.length < before.length + after.length) return null;
  return specifier.slice(before.length, specifier.length - after.length);
}
async function throughPackages(packages, specifier) {
  const owning = packageFor(packages, specifier);
  if (owning === null) return null;
  const rest = specifier.slice(owning.name.length).replace(/^\//, "");
  if (rest.length > 0) return moduleAt(join17(owning.root, rest));
  return entryFileFor(owning.root).catch(() => null);
}
function packageFor(packages, specifier) {
  return packages.find(
    (one) => specifier === one.name || specifier.startsWith(`${one.name}/`)
  ) ?? null;
}

// src/sources/tree.ts
var DEFAULT_DEPTH = 2;
var MAX_DEPTH = 5;
function flatLines(node, indent = 0) {
  return [
    { indent, name: node.name },
    ...node.children.flatMap((child) => flatLines(child, indent + 1))
  ];
}
async function screenTree(rootDir, file, options = {}) {
  const depth = Math.min(Math.max(1, options.depth ?? DEFAULT_DEPTH), MAX_DEPTH);
  const resolve10 = await resolverFor(rootDir);
  const read = /* @__PURE__ */ new Set();
  const state = { truncated: false };
  const root = await nodeFor(rootDir, file, depth, resolve10, read, state, /* @__PURE__ */ new Set());
  if (root === null) return null;
  return { root, depth, truncated: state.truncated, read: [...read] };
}
async function nodeFor(rootDir, file, left, resolve10, read, state, seen) {
  const pair = await pairOf(file);
  const identity = pair?.identity ?? file;
  if (seen.has(identity)) return null;
  const own = await readFile19(identity, "utf8").catch(() => null);
  if (own === null) return null;
  read.add(identity);
  const markup = pair === null ? { path: file, source: own } : await markupOf(identity, own);
  if (pair?.markup != null) read.add(pair.markup);
  const kind = templateKind(markup.path);
  const shape = shapeOf(markup.source, kind ?? void 0);
  if (shape === null || shape.holder === null) return null;
  const surface = { holder: shape.holder, children: shape.body };
  const file_ = { path: identity, bindings: importsIn(own), declared: declaredNames(own) };
  let selectors = null;
  const selectorsIn = async () => selectors ??= await selectorMap(identity, file_.bindings, resolve10, read);
  const next = new Set(seen).add(identity);
  const wiring = surface.children.length === 0 && isTemplateComponent(surface.holder);
  const followed = wiring ? await followRoot(rootDir, file_, selectorsIn, surface.holder, kind, left, resolve10, read, state, next) : null;
  const children = followed !== null ? followed.children : await Promise.all(
    surface.children.map(
      (name) => childNode(rootDir, file_, selectorsIn, name, kind, left, resolve10, read, state, next)
    )
  );
  if (kind === null && followed === null) {
    const { passed, unresolved } = passedContent(own);
    for (const one of passed) {
      const node = await childNode(
        rootDir,
        file_,
        selectorsIn,
        one.name,
        kind,
        left,
        resolve10,
        read,
        state,
        next
      );
      children.push({ ...node, via: `${one.to}.${one.via}` });
    }
    for (const where2 of unresolved) {
      children.push({ name: where2, file: null, at: "unresolved", children: [], via: where2 });
    }
  }
  return {
    name: surface.holder,
    file: relative7(rootDir, identity),
    at: "project",
    children,
    ...followed?.holderAt === void 0 ? {} : { holderAt: followed.holderAt }
  };
}
async function childNode(rootDir, from, selectorsIn, name, kind, left, resolve10, read, state, seen) {
  const specifier = from.bindings.get(name);
  const target = kind === null ? specifier === void 0 ? null : await resolve10.find(from.path, specifier) : (await selectorsIn()).get(name) ?? null;
  if (target === null) {
    return { name, file: null, at: whyNot(from, name, kind, resolve10), children: [] };
  }
  if (resolve10.packageOf(target) !== resolve10.packageOf(from.path)) {
    return { name, file: relative7(rootDir, target), at: "package", children: [] };
  }
  if (left <= 1) {
    state.truncated = true;
    return { name, file: relative7(rootDir, target), at: "beyond", children: [] };
  }
  const node = await nodeFor(rootDir, target, left - 1, resolve10, read, state, seen);
  if (node === null) {
    return { name, file: relative7(rootDir, target), at: "project", children: [] };
  }
  return { name, file: relative7(rootDir, target), at: "project", children: [node] };
}
async function followRoot(rootDir, from, selectorsIn, holder, kind, left, resolve10, read, state, seen) {
  const node = await childNode(
    rootDir,
    from,
    selectorsIn,
    holder,
    kind,
    left,
    resolve10,
    read,
    state,
    seen
  );
  if (node.children.length === 1) return { children: node.children };
  return node.at === "package" || node.at === "beyond" ? { children: [], holderAt: node.at } : { children: [] };
}
async function selectorMap(from, bindings, resolve10, read) {
  const found = /* @__PURE__ */ new Map();
  for (const specifier of new Set(bindings.values())) {
    const candidate = await resolve10.find(from, specifier);
    if (candidate === null) continue;
    read.add(candidate);
    const selector = await selectorOf(candidate);
    if (selector !== null && !found.has(selector)) found.set(selector, candidate);
  }
  return found;
}
function importsIn(source) {
  const found = /* @__PURE__ */ new Map();
  const ast = parseModule(source);
  if (ast === null) return found;
  walk(ast.program, (node) => {
    if (node.type !== "ImportDeclaration") return;
    for (const specifier of node.specifiers) {
      found.set(specifier.local.name, node.source.value);
    }
  });
  return found;
}
function declaredNames(source) {
  const found = /* @__PURE__ */ new Set();
  const ast = parseModule(source);
  if (ast === null) return found;
  walk(ast.program, (node) => {
    if (node.type === "VariableDeclarator" && node.id.type === "Identifier") found.add(node.id.name);
    if (node.type === "FunctionDeclaration" && node.id != null) found.add(node.id.name);
    if (node.type === "ClassDeclaration" && node.id != null) found.add(node.id.name);
  });
  return found;
}
function whyNot(from, name, kind, resolve10) {
  if (kind !== null) return "unresolved";
  const specifier = from.bindings.get(name);
  if (specifier === void 0) return from.declared.has(name) ? "local" : "unresolved";
  return resolve10.shape(specifier) === "package" ? "external" : "unresolved";
}

// src/sources/matrix.ts
import { readFile as readFile20 } from "node:fs/promises";
import { relative as relative8 } from "node:path";
async function propsMatrix(rootDir, component, files) {
  const renders = [];
  const absent = [];
  const unreadable = [];
  const written = /* @__PURE__ */ new Map();
  for (const file of files) {
    const where2 = relative8(rootDir, file);
    const read = await sourceOf(file);
    if (read === null) {
      unreadable.push(where2);
      continue;
    }
    const one = writtenIn(read.path, read.source, { all: true }).find(
      (each) => each.component === component
    );
    if (one === void 0) {
      absent.push(where2);
      continue;
    }
    renders.push(where2);
    for (const [name, value] of one.attributes) {
      const row = written.get(name) ?? { files: [], values: [] };
      row.files.push(where2);
      row.values.push(value.value);
      written.set(name, row);
    }
  }
  const rows = [...written.entries()].map(([name, row]) => ({
    name,
    written: row.files,
    value: agreed(row.values)
  })).sort((a, b) => b.written.length - a.written.length || a.name.localeCompare(b.name));
  return { component, renders, absent, unreadable, rows };
}
function agreed(values) {
  const first = values[0];
  if (first === null || first === void 0) return null;
  return values.every((value) => value === first) ? first : null;
}
async function sourceOf(file) {
  const pair = await pairOf(file);
  const identity = pair?.identity ?? file;
  const own = await readFile20(identity, "utf8").catch(() => null);
  if (own === null) return null;
  return pair === null ? { path: file, source: own } : markupOf(identity, own);
}

// src/sources/grouping.ts
import { relative as relative9 } from "node:path";
async function groupScreens(rootDir, files, depth) {
  const read = [];
  const notScreens = [];
  let applied = 0;
  const given = new Set(files);
  const parts = /* @__PURE__ */ new Set();
  for (const file of files) {
    for (const imported of await importedBy(file)) {
      if (given.has(imported)) parts.add(imported);
    }
  }
  for (const file of files) {
    if (!isScreenFile(file) || ROLE_FILE.test(file) || parts.has(file)) {
      notScreens.push(relative9(rootDir, file));
      continue;
    }
    const tree2 = await screenTree(rootDir, file, depth === void 0 ? {} : { depth });
    if (tree2 === null) {
      notScreens.push(relative9(rootDir, file));
      continue;
    }
    applied = tree2.depth;
    read.push({ file: relative9(rootDir, file), lines: flatLines(tree2.root) });
  }
  const screensWith = /* @__PURE__ */ new Map();
  for (const one of read) {
    for (const name of new Set(one.lines.map((line) => line.name))) {
      screensWith.set(name, (screensWith.get(name) ?? 0) + 1);
    }
  }
  const singletonSuffixes = /* @__PURE__ */ new Map();
  for (const [name, count] of screensWith) {
    if (count > 1) continue;
    const word = trailingWord(name);
    if (word !== null) singletonSuffixes.set(word, (singletonSuffixes.get(word) ?? 0) + 1);
  }
  const groups = /* @__PURE__ */ new Map();
  const ungrouped = [];
  for (const one of read) {
    const concrete = one.lines.map((line) => `${"  ".repeat(line.indent)}${line.name}`);
    const abstracted = one.lines.map(
      (line) => abstract(line.name, screensWith, singletonSuffixes)
    );
    if (abstracted.every((name) => name === "<one>")) {
      ungrouped.push(one.file);
      continue;
    }
    const signature = one.lines.map(
      (line, at) => `${"  ".repeat(line.indent)}${abstracted[at]}`
    );
    const key = signature.join("\n");
    const group2 = groups.get(key) ?? { signature, members: [], concrete };
    group2.members.push(one.file);
    groups.set(key, group2);
  }
  const merged = mergeOptional([...groups.values()]);
  return {
    depth: applied,
    // **A group of one is shown as it is written.** The placeholders exist to
    // merge screens whose middles differ, and a group that merged nothing has
    // nothing to hide behind them — `<one>` above `<one>` tells the reader less
    // than `Dialog` above `DialogContent`, which is what the file says.
    groups: merged.sort((a, b) => b.members.length - a.members.length).map(({ signature, members, concrete }) => ({
      signature: members.length === 1 ? concrete : signature,
      members
    })),
    notScreens,
    ungrouped,
    given: files.length
  };
}
var ROLE_FILE = /\.(?:helpers?|utils?|constants?|types?|styles?|mocks?|fixtures?)\.[jt]sx?$/i;
function abstract(name, screensWith, singletonSuffixes) {
  if ((screensWith.get(name) ?? 0) > 1) return name;
  const word = trailingWord(name);
  if (word !== null && (singletonSuffixes.get(word) ?? 0) > 1) return `*${word}`;
  return "<one>";
}
function mergeOptional(candidates) {
  const order = [...candidates].sort((a, b) => b.signature.length - a.signature.length);
  const kept = [];
  for (const candidate of order) {
    const into = kept.filter((one) => subsequence(candidate.signature, one.host.signature)).map((one) => ({ one, extra: one.host.signature.length - candidate.signature.length })).filter(({ extra }) => extra < candidate.signature.length).sort((a, b) => a.extra - b.extra)[0]?.one;
    if (into === void 0) {
      kept.push({ host: candidate, folded: [] });
      continue;
    }
    into.folded.push(candidate);
    into.host.members.push(...candidate.members);
  }
  return kept.map(({ host, folded }) => {
    if (folded.length === 0) return host;
    const total = host.members.length;
    const signature = host.signature.map((line) => {
      const has = total - folded.filter((one) => !one.signature.includes(line)).reduce((sum, one) => sum + one.members.length, 0);
      return has === total ? line : `${line}  ${has} of ${total}`;
    });
    return { ...host, signature };
  });
}
function subsequence(small, whole) {
  if (small.length >= whole.length) return false;
  let at = 0;
  for (const line of whole) {
    if (at < small.length && small[at] === line) at++;
  }
  return at === small.length;
}

// src/checks/contract.ts
import { basename as basename7 } from "node:path";
var SHAPE2 = {
  literal: "a literal",
  call: "a call",
  expression: "an expression"
};
var fills = (configured, rendered) => configured.startsWith("*") ? trailingWord(rendered) === configured.slice(1) : configured === rendered;
var holderOf = (contract) => contract.skeleton?.holder ?? contract.kind;
function contractsForScreen(contracts, holder) {
  if (holder === null) return [];
  return contracts.filter((contract) => holderOf(contract) === holder);
}
function contractDeviations(file, source, contract) {
  if (!isScreenFile(basename7(file))) return null;
  const page = regionsOf(source, templateKind(file) ?? void 0);
  const found = [];
  const say = (message) => {
    found.push({ file, message });
  };
  const skeleton = contract.skeleton;
  if (skeleton !== null && page !== null) {
    if (page.holder !== skeleton.holder) {
      say(`sits in <${page.holder}>; screens of this kind use <${skeleton.holder}>`);
    }
    const compared = compareOrder(
      page.order.map((one) => one.region),
      skeleton.regions
    );
    for (const role of compared.missing) {
      say(`has no ${role}; every screen of this kind has one`);
    }
    if (!compared.inOrder) {
      say(`holds ${compared.actual.join(", ")}; this kind holds ${compared.expected.join(", ")}`);
    }
  }
  if (page !== null) {
    for (const { role, component } of contract.vocabulary) {
      const filling = page.order.filter((one) => one.region === role);
      if (filling.length === 0 || filling.some((one) => one.component === component)) continue;
      const names = [...new Set(filling.map((one) => `<${one.component}>`))].join(" or ");
      say(`fills ${role} with ${names}; this kind uses <${component}>`);
    }
  }
  const avoids = contract.avoids ?? [];
  if (avoids.length > 0) {
    const raw = rawMarkupOf(source, templateKind(file) ?? void 0) ?? [];
    for (const element of avoids) {
      if (!raw.includes(element)) continue;
      say(`renders a raw <${element}>; no screen of this kind does`);
    }
  }
  const written = contract.configuration.length === 0 ? [] : writtenIn(file, source, { all: true });
  for (const configured of contract.configuration) {
    const uses = written.filter((one) => fills(configured.component, one.component));
    if (uses.length === 0) continue;
    const spelt = configured.component.startsWith("*") ? uses[0]?.component ?? configured.component : configured.component;
    const support = configured.agreedBy >= configured.seenIn ? "which every screen of this kind writes" : `which ${configured.agreedBy} of the ${configured.seenIn} screens of this kind write`;
    for (const always of configured.written ?? []) {
      const strength = always.writtenBy >= configured.seenIn ? "which every screen of this kind writes" : `which ${always.writtenBy} of the ${configured.seenIn} screens of this kind write`;
      const values = uses.map((use) => use.attributes.get(always.name));
      if (values.every((value) => value === void 0)) {
        say(`writes <${spelt}> without ${always.name}, ${strength}`);
        continue;
      }
      if (always.shape === null) continue;
      const differs = values.find((value) => value !== void 0 && value.shape !== always.shape);
      if (differs === void 0) continue;
      say(
        `writes ${always.name} as ${SHAPE2[differs.shape]} on <${spelt}>, where ${always.writtenBy >= configured.seenIn ? "every screen of this kind writes" : `${always.writtenBy} of the ${configured.seenIn} write it as`} ${SHAPE2[always.shape]}`
      );
    }
    for (const prop of configured.props) {
      const stated2 = uses.map((use) => use.attributes.get(prop.name)?.value);
      if (stated2.every((value) => value === prop.value)) continue;
      if (stated2.some((value) => value === null)) continue;
      const how = prop.bare ? prop.name : `${prop.name}="${quoted(prop.value)}"`;
      const other = stated2.filter(
        (value) => typeof value === "string" && value !== prop.value
      )[0];
      say(
        other === void 0 ? `writes <${spelt}> without ${how}, ${support}` : `writes <${spelt} ${prop.name}="${quoted(other)}">, where this kind writes ${how} \u2014 ${support}`
      );
    }
  }
  return found;
}
function isContract(value) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const candidate = value;
  return Array.isArray(candidate.vocabulary) && Array.isArray(candidate.configuration) && candidate.skeleton !== void 0;
}

// src/checks/pattern-check.ts
var counted = (strength) => {
  const match = /^(\d+)\s+of\s+(\d+)\b/.exec(strength ?? "");
  return match === null ? null : { by: Number(match[1]), of: Number(match[2]) };
};
var required = (line) => {
  const count = counted(line.strength);
  return line.strength === null || count !== null && count.by === count.of;
};
var matches = (line, rendered) => {
  if (line.startsWith("*")) return trailingWord(rendered) === line.slice(1);
  return line === rendered;
};
var isProse = (name) => name.startsWith("<") && name.endsWith(">");
function patternDeviations(file, source, pattern2, tree2) {
  const deviations = [];
  const say = (message) => {
    deviations.push({ file, message });
  };
  if (tree2 !== null) checkStructure(pattern2, tree2, say);
  checkProps(file, source, pattern2, say);
  return { deviations, handedOver: handOver(pattern2) };
}
function checkStructure(pattern2, tree2, say) {
  const [root, ...rest] = pattern2.structure;
  if (root === void 0) return;
  if (!isProse(root.name) && !matches(root.name, tree2.root.name)) {
    say(`sits in <${tree2.root.name}>; screens of this kind sit in <${root.name}>`);
    return;
  }
  const rendered = flatLines(tree2.root);
  for (const line of rest) {
    if (isProse(line.name) || !required(line)) continue;
    const found = rendered.some(
      (one) => one.indent === line.indent && matches(line.name, one.name)
    );
    if (!found) {
      const anywhere = rendered.some((one) => matches(line.name, one.name));
      say(
        anywhere ? `renders <${line.name}> somewhere else; screens of this kind hold it ${where(line.indent)}` : `does not render <${line.name}>, which every screen of this kind has`
      );
    }
  }
  const order = rest.filter((line) => line.indent === 1 && !isProse(line.name) && required(line));
  const at = (name) => rendered.findIndex((one) => one.indent === 1 && matches(name, one.name));
  const places = order.map((line) => at(line.name));
  if (places.every((one) => one >= 0)) {
    for (let i = 1; i < places.length; i++) {
      if (places[i] < places[i - 1]) {
        say(
          `renders <${order[i].name}> before <${order[i - 1].name}>; screens of this kind write them the other way round`
        );
        break;
      }
    }
  }
}
var where = (indent) => indent === 1 ? "directly inside the holder" : `${indent} levels in`;
function checkProps(file, source, pattern2, say) {
  if (pattern2.props.length === 0) return;
  const written = writtenIn(file, source, { all: true });
  for (const component of pattern2.props) {
    const uses = written.filter((one) => matches(component.component, one.component));
    if (uses.length === 0) continue;
    const spelt = uses[0]?.component ?? component.component;
    for (const prop of component.props) {
      const strength = prop.writtenBy !== null && prop.of !== null ? prop.writtenBy >= prop.of ? "which every screen of this kind writes" : `which ${prop.writtenBy} of the ${prop.of} screens of this kind write` : prop.strength === null ? "which this kind of screen writes" : `which the pattern states as: ${prop.strength}`;
      const values = uses.map((use) => use.attributes.get(prop.name));
      if (values.every((value) => value === void 0)) {
        say(`writes <${spelt}> without ${prop.name}, ${strength}`);
        continue;
      }
      if (prop.value === null) continue;
      const stated2 = values.map((value) => value?.value);
      if (stated2.some((value) => value === null)) continue;
      if (stated2.every((value) => value === void 0 || value === prop.value)) continue;
      const other = stated2.find((value) => value !== void 0 && value !== prop.value);
      say(
        `writes <${spelt} ${prop.name}="${quoted(other)}">, where this kind writes ${prop.name}="${quoted(prop.value)}" \u2014 ${strength}`
      );
    }
  }
}
function handOver(pattern2) {
  const slots = pattern2.structure.filter((line) => isProse(line.name)).map((line) => `${line.name}${line.strength === null ? "" : ` \u2014 ${line.strength}`}`);
  return [
    ...pattern2.rules,
    ...slots.length === 0 ? [] : [`slots nothing here reads: ${slots.join(", ")}`]
  ];
}

// src/knowledge/pattern-write.ts
function renderPattern(pattern2, options) {
  const { name, observed, files } = options;
  const total = pattern2.family.length;
  const out = [
    "---",
    `pattern: ${safe(name)}`,
    ...pattern2.kind === null ? [] : [`holder: ${safe(pattern2.kind)}`],
    `read: ${total} ${total === 1 ? "file" : "files"}`,
    `from: ${pattern2.from}`,
    `observed: ${observed}`,
    // The field #28's refresh reads. A sentence in the prose would have to be
    // parsed as English to tell a derived file from an approved one.
    "derived: true",
    "---",
    "",
    `# ${title(safe(name))}`,
    "",
    derivedFrom(pattern2, total),
    ""
  ];
  const structure = structureBlock(pattern2, total);
  if (structure.length > 0) {
    out.push("## Structure", "", "```", ...structure, "```", "");
  }
  if (pattern2.propsUnmeasured !== null) {
    const { siblings, needed } = pattern2.propsUnmeasured;
    out.push("## Props", "", `**Not measured.** ${whyUnmeasured(siblings, needed)}`, "");
  }
  const props2 = propsBlock(pattern2);
  if (props2.length > 0) {
    out.push(
      "## Props",
      "",
      // Otherwise `4 of 4` under `read: 5 files` reads as an arithmetic slip.
      // The reference is left out of its own counts on purpose: with a small
      // family the page being asked about would otherwise settle the majority
      // on whether what it does is what everyone does.
      `_Counted over the ${total - 1} screens beside the reference, which is left out of its own counts._`,
      "",
      ...props2
    );
  }
  if (pattern2.avoids.length > 0) {
    out.push(
      "## Avoided elements",
      "",
      `No screen of this kind renders ${list(pattern2.avoids.map((one) => `\`<${safe(one)}>\``))}.`,
      // The element is named and the replacement is not: what replaces it is
      // this project's own business, and the structure above already says what
      // the family renders instead.
      ""
    );
  }
  if (pattern2.wiring.length > 0) {
    out.push(
      "## Wiring",
      "",
      `Most screens of this kind call ${list(pattern2.wiring.map((one) => `\`${safe(one)}()\``))}.`,
      "",
      "_Read from JavaScript only: a screen written as a template contributes nothing here._",
      ""
    );
  }
  const particulars = particularsBlock(pattern2, options);
  if (particulars.length > 0) out.push("## Particular to one screen", "", ...particulars, "");
  out.push("## Still to be written", "", ...gaps(pattern2), "");
  out.push(
    "## Where it is used",
    "",
    files.map((path) => `\`${safe(path)}\``).join(", "),
    ""
  );
  return `${out.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd()}
`;
}
function derivedFrom(pattern2, total) {
  const where2 = {
    pattern: "named together by a pattern file",
    routes: "registered beside one another in the project's route table",
    folder: "found in the folders around the reference, which is a guess about which of them are of a kind",
    holder: "found in this application sitting in the same holder, which is structural but is not a registration anybody wrote"
  }[pattern2.from];
  const built = pattern2.built === "markup" ? " These screens are built out of markup and classes rather than layout components, so there is no component to name for most roles." : "";
  return `Derived by \`uic pattern\` from ${total} ${total === 1 ? "screen" : "screens"} ${where2}.${built} Nothing here has been approved by a person; the counts are evidence as at the date above, and \`uic patterns\` says what has moved since.`;
}
function structureBlock(pattern2, total) {
  if (pattern2.skeleton === null) return [];
  const width = 36;
  const line = (indent, name, strength) => {
    const written = `${"  ".repeat(indent)}${name}`;
    return `${written.padEnd(width - 2)}  ${strength}`;
  };
  const out = [line(0, safe(pattern2.skeleton.holder), `majority of ${total}`)];
  for (const region of pattern2.skeleton.regions) {
    const filled = pattern2.vocabulary.find((one) => one.role === region);
    out.push(
      filled === void 0 ? line(1, `<${region}>`, `majority of ${total}`) : line(1, safe(filled.component), `majority of ${total}`)
    );
  }
  if (pattern2.skeleton.regions.length === 0 && pattern2.body !== null) {
    const held = pattern2.body.component === null ? pattern2.body.suffix === null ? "<body>" : `*${safe(pattern2.body.suffix)}` : safe(pattern2.body.component);
    const count = pattern2.body.children;
    out.push(line(1, held, `exactly ${count === 1 ? "one" : count}; ${total} of ${total}`));
  }
  return out;
}
function propsBlock(pattern2) {
  const out = [];
  for (const usage of pattern2.configuration) {
    const bullets = [];
    const shapes = [];
    const valued = new Set(usage.props.map((one) => one.name));
    for (const prop of usage.props) {
      bullets.push(`- \`${safe(prop.name)}\`${stated(prop)} \u2014 ${usage.agreedBy} of ${usage.seenIn}`);
    }
    for (const written of usage.written) {
      if (valued.has(written.name)) continue;
      bullets.push(`- \`${safe(written.name)}\` \u2014 ${written.writtenBy} of ${usage.seenIn}`);
      if (written.shape !== null) shapes.push(`\`${safe(written.name)}\` ${article(written.shape)}`);
    }
    if (usage.classes.length > 0 && usage.classAttribute !== null) {
      bullets.push(
        `- \`${safe(usage.classAttribute)}\` = "${safe(usage.classes.join(" "))}" \u2014 ${usage.agreedBy} of ${usage.seenIn}`
      );
    }
    if (bullets.length === 0) continue;
    out.push(`### \`${safe(usage.component)}\``, "", ...bullets, "");
    if (shapes.length > 0) out.push(`Written as: ${list(shapes)}.`, "");
  }
  return out;
}
var stated = (prop) => {
  const value = safe(prop.value);
  return prop.bare || value.includes('"') ? "" : ` = "${value}"`;
};
function particularsBlock(pattern2, options) {
  const { roles, components } = pattern2.particulars;
  if (roles.length === 0 && components.length === 0) return [];
  const has = [
    ...roles.length > 0 ? [`a ${list(roles.map((one) => `\`${safe(one)}\``))} region`] : [],
    ...components.length > 0 ? [list(components.map((one) => `\`${safe(one)}\``))] : []
  ];
  return [
    `\`${options.reference}\` renders ${list(has)}, which no other screen of this kind does.`,
    "",
    "_Whether that is deliberate is not readable from the code. Say which it is._"
  ];
}
function gaps(pattern2) {
  const slots = pattern2.skeleton?.regions.filter(
    (region) => !pattern2.vocabulary.some((one) => one.role === region)
  );
  return [
    "Derived facts only, so far. These are the parts of a pattern that no extraction can produce, and the file is not finished until somebody has answered them:",
    "",
    ...slots !== void 0 && slots.length > 0 ? [
      `- **Slots.** ${list(slots.map((one) => `\`<${safe(one)}>\``))} ${slots.length === 1 ? "is" : "are"} filled by a different component on each screen. Which alternatives are allowed there, and what decides between them?`
    ] : [],
    "- **Rules.** What must a screen of this kind do that no checker can evaluate? *(\u201CActions are always rendered; permission toggles `disabled` only.\u201D)*",
    "- **Exceptions.** Where a screen above departs from the rest, is that deliberate, and why?"
  ];
}
var title = (name) => {
  const words = name.replace(/[-_]+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
};
var whyUnmeasured = (siblings, needed) => siblings < needed ? `The props of a family are counted over the screens *beside* the reference, which leaves ${siblings} here, and ${needed} are needed \u2014 below that a pair is a copy rather than an agreement. This is not a family that writes no props; it is a family too small to tell the two apart. One more screen of this kind, and this section answers.` : `Of the ${siblings} screens beside the reference, fewer than ${needed} could be read for what they render, so there was nothing to count. This says nothing about what the family writes.`;
var article = (word) => `${/^[aeiou]/i.test(word) ? "an" : "a"} ${word}`;
var safe = (value) => quoted(value);
var list = (items) => items.length <= 1 ? items[0] ?? "" : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
function refreshPattern(raw, pattern2, options) {
  const rendered = renderPattern(pattern2, options);
  const fresh = sectionsOf(rendered);
  const changed = [];
  let text = raw;
  for (const heading of COUNTED) {
    const replacement = fresh.get(heading)?.map((one) => one.trim()).join("\n\n") ?? null;
    const existing = sectionsOf(text).get(heading) ?? [];
    if (replacement === null) {
      if (existing.length === 0) continue;
      for (const one of existing) text = text.replace(one, "");
      changed.push(`${heading} \u2014 nothing to state now`);
      continue;
    }
    if (existing.length === 0) {
      text = `${text.trimEnd()}

${replacement}
`;
      changed.push(`${heading} \u2014 added`);
      continue;
    }
    if (existing.length === 1 && existing[0].trim() === replacement) continue;
    text = swap(text, existing[0], `${replacement}

`);
    for (const one of existing.slice(1)) text = text.replace(one, "");
    changed.push(heading);
  }
  const was = frontLine(raw, "observed");
  const rewritten = FRONT.reduce((carry, key) => {
    const value = frontLine(rendered, key);
    return value === null ? carry : setFrontLine(carry, key, value);
  }, text);
  if (rewritten !== text) changed.push(`frontmatter${was === null ? "" : ` (observed ${was})`}`);
  return { text: `${rewritten.trimEnd()}
`, changed };
}
var COUNTED = [
  "Structure",
  "Props",
  "Avoided elements",
  "Wiring",
  "Particular to one screen",
  "Where it is used"
];
var FRONT = ["holder", "read", "from", "observed"];
function sectionsOf(raw) {
  const found = /* @__PURE__ */ new Map();
  const starts = [];
  let fenced = false;
  let at = 0;
  for (const line of raw.split("\n")) {
    if (/^\s*(?:```|~~~)/.test(line)) fenced = !fenced;
    else if (!fenced) {
      const heading = /^## +(.+?) *$/.exec(line);
      if (heading !== null) starts.push({ title: heading[1], at });
    }
    at += line.length + 1;
  }
  for (const [at2, one] of starts.entries()) {
    const whole = raw.slice(one.at, starts[at2 + 1]?.at ?? raw.length);
    found.set(one.title, [...found.get(one.title) ?? [], whole]);
  }
  return found;
}
var swap = (text, from, to) => text.replace(from, () => to);
var frontLine = (raw, key) => new RegExp(`^${key} *: *(.*)$`, "m").exec(raw.split(/^---$/m)[1] ?? "")?.[1]?.trim() ?? null;
function setFrontLine(raw, key, value) {
  const match = /^(---\n)([\s\S]*?)(\n---\n)/.exec(raw);
  if (match === null) return raw;
  const line = new RegExp(`^${key} *:.*$`, "m");
  const block = line.test(match[2]) ? match[2].replace(line, () => `${key}: ${value}`) : `${match[2]}
${key}: ${value}`;
  return `${match[1]}${block}${match[3]}${raw.slice(match[0].length)}`;
}

// src/cli/log.ts
import { appendFile, readdir as readdir10, readFile as readFile21, rename, stat as stat10, writeFile as writeFile4 } from "node:fs/promises";
import { join as join18, relative as relative10 } from "node:path";
var logPath = (rootDir) => join18(cacheRoot(), projectKey(rootDir), "findings.jsonl");
var contractPathFor = (rootDir, kind) => join18(logPath(rootDir), "..", `contract-${kind.replace(/[^\w.-]+/g, "-")}.json`);
var contractsFor = async (rootDir) => {
  const dir = await ownedDir(projectKey(rootDir));
  if (dir === null) return [];
  const entries = await readdir10(dir).catch(() => null);
  return (entries ?? []).filter((name) => /^contract-.*\.json$/.test(name)).sort().map((name) => join18(dir, name));
};
var MAX_BYTES2 = 4e6;
var statePath = (rootDir) => join18(logPath(rootDir), "..", "seen.jsonl");
var MAX_STATE_BYTES = 512e3;
var keyOf = (entry) => `${entry.file}|${entry.line}|${entry.level}|${entry.message}`;
var readSeen = async (rootDir) => {
  const raw = await readFile21(statePath(rootDir), "utf8").catch(() => null);
  if (raw === null) return {};
  const folded = {};
  for (const line of raw.split("\n")) {
    if (line.trim() === "") continue;
    try {
      const parsed = JSON.parse(line);
      if (typeof parsed.k !== "string" || typeof parsed.at !== "number") continue;
      const existing = folded[parsed.k];
      folded[parsed.k] = existing === void 0 ? { first: parsed.at, last: parsed.at, times: 1 } : {
        first: Math.min(existing.first, parsed.at),
        last: Math.max(existing.last, parsed.at),
        times: existing.times + 1
      };
    } catch {
    }
  }
  return folded;
};
var isOn = (options) => options.enabled ?? process.env["UIC_LOG"]?.toLowerCase() !== "off";
var record = async (rootDir, findings, options = {}, kind = "finding") => {
  if (findings.length === 0 || !isOn(options)) return;
  try {
    const now = options.now ?? (() => Date.now());
    const at = now();
    const base = options.rootDir ?? rootDir;
    const path = logPath(rootDir);
    const dir = await ownedDir(projectKey(rootDir));
    if (dir === null) return;
    await writeFile4(join18(dir, "repo.txt"), `${base}
`, "utf8").catch(() => void 0);
    const size = await stat10(path).then(
      (info) => info.size,
      () => 0
    );
    if (size > MAX_BYTES2) await rename(path, `${path}.1`).catch(() => void 0);
    const seen = await readSeen(rootDir);
    const state = statePath(rootDir);
    const stateSize = await stat10(state).then(
      (info) => info.size,
      () => 0
    );
    if (stateSize > MAX_STATE_BYTES) await rename(state, `${state}.1`).catch(() => void 0);
    for (const finding of findings) {
      const entry = {
        at,
        file: relative10(base, finding.file) || finding.file,
        line: finding.line,
        level: finding.level,
        message: finding.message,
        kind
      };
      const key = `${kind}|${keyOf(entry)}`;
      await appendFile(state, `${JSON.stringify({ k: key, at })}
`, "utf8");
      if (seen[key] === void 0) {
        await appendFile(path, `${JSON.stringify(entry)}
`, "utf8");
      }
    }
  } catch {
  }
};
var readLog = async (rootDir) => {
  const raw = await readFile21(logPath(rootDir), "utf8").catch(() => null);
  if (raw === null) return [];
  const entries = /* @__PURE__ */ new Map();
  for (const line of raw.split("\n")) {
    if (line.trim() === "") continue;
    try {
      const parsed = JSON.parse(line);
      if (typeof parsed !== "object" || parsed === null || !("level" in parsed)) continue;
      const entry = parsed;
      const key = `${entry.kind}|${keyOf(entry)}`;
      const existing = entries.get(key);
      if (existing === void 0) entries.set(key, entry);
      else if (entry.at < existing.at) entries.set(key, entry);
    } catch {
    }
  }
  return [...entries.values()].sort((a, b) => a.at - b.at);
};
var WORTH_A_RULE = 3;
var groupOf = (entry, imported) => imported === null ? `${entry.file}|${entry.line}|${entry.level}|${entry.message}` : `${entry.file}|${entry.line}|${entry.level}|${imported.importedFrom}|${imported.expectedFrom}`;
var summarise = (entries, seenState = {}) => {
  const groups = /* @__PURE__ */ new Map();
  const lastOnFile = /* @__PURE__ */ new Map();
  let advice = 0;
  for (const entry of entries) {
    if (entry.kind === "advice") {
      advice++;
      continue;
    }
    const state = seenState[`finding|${keyOf(entry)}`];
    const times = state?.times ?? 1;
    const last = state?.last;
    lastOnFile.set(entry.file, Math.max(lastOnFile.get(entry.file) ?? 0, last ?? entry.at));
    const imported = readImportSentence(entry.message);
    const key = groupOf(entry, imported);
    const existing = groups.get(key);
    if (existing === void 0) {
      groups.set(key, { entry, imported, times, last });
      continue;
    }
    for (const symbol of imported?.symbols ?? []) {
      if (existing.imported !== null && !existing.imported.symbols.includes(symbol)) {
        existing.imported.symbols.push(symbol);
      }
    }
    existing.times = Math.max(existing.times, times);
    existing.last = existing.last === void 0 || last === void 0 ? void 0 : Math.max(existing.last, last);
  }
  const said = (group2) => group2.imported === null ? group2.entry.message : importSentence(
    group2.imported.symbols,
    group2.imported.importedFrom,
    group2.imported.expectedFrom
  );
  const byLevel = {};
  const perFile2 = /* @__PURE__ */ new Map();
  const across = /* @__PURE__ */ new Map();
  let acted = 0;
  let unknown = 0;
  for (const group2 of groups.values()) {
    const { entry } = group2;
    byLevel[entry.level] = (byLevel[entry.level] ?? 0) + 1;
    perFile2.set(entry.file, (perFile2.get(entry.file) ?? 0) + 1);
    const spoken = group2.imported === null ? said(group2) : importSourceSentence(group2.imported.importedFrom, group2.imported.expectedFrom);
    const shape = `${entry.level}|${spoken}`;
    const spread = across.get(shape) ?? {
      level: entry.level,
      message: spoken,
      files: /* @__PURE__ */ new Set()
    };
    spread.files.add(entry.file);
    across.set(shape, spread);
    if (group2.times > 1) continue;
    const activity = lastOnFile.get(entry.file);
    if (group2.last !== void 0 && activity !== void 0 && group2.last < activity) acted++;
    else unknown++;
  }
  return {
    total: groups.size,
    acted,
    unknown,
    advice,
    byLevel,
    byFile: [...perFile2.entries()].map(([file, count]) => ({ file, count })).sort((a, b) => b.count - a.count),
    repeated: [...groups.values()].filter((group2) => group2.times > 1).map((group2) => ({
      file: group2.entry.file,
      line: group2.entry.line,
      message: said(group2),
      times: group2.times
    })).sort((a, b) => b.times - a.times),
    spread: [...across.values()].filter((group2) => group2.files.size >= WORTH_A_RULE).map((group2) => ({ level: group2.level, message: group2.message, files: group2.files.size })).sort((a, b) => b.files - a.files),
    from: entries[0]?.at ?? null,
    to: entries[entries.length - 1]?.at ?? null
  };
};

// src/checks/shapes.ts
var MIN_SIZE = 4;
var QUORUM2 = 3;
function elementName(element) {
  const name = element.openingElement.name;
  if (name.type === "JSXIdentifier") return name.name;
  if (name.type === "JSXMemberExpression") {
    const parts = [];
    let current = name;
    while (current.type === "JSXMemberExpression") {
      parts.unshift(current.property.name);
      current = current.object;
    }
    if (current.type === "JSXIdentifier") parts.unshift(current.name);
    return parts.join(".");
  }
  if (name.type === "JSXNamespacedName") return `${name.namespace.name}:${name.name.name}`;
  return null;
}
function canonical(element) {
  const name = elementName(element);
  if (name === null) return null;
  const children = [];
  let size = 1;
  for (const inner of canonicalChildren(element.children)) {
    children.push(inner.text);
    size += inner.size;
  }
  return {
    text: children.length === 0 ? name : `${name}(${children.join(",")})`,
    size
  };
}
function canonicalChildren(nodes) {
  const found = [];
  for (const child of nodes) {
    if (child.type === "JSXElement") {
      const inner = canonical(child);
      if (inner !== null) found.push(inner);
      continue;
    }
    if (child.type === "JSXFragment") {
      found.push(...canonicalChildren(child.children));
      continue;
    }
    if (child.type === "JSXExpressionContainer") {
      const nested = [];
      walk(child.expression, (node) => {
        if (node.type === "JSXElement") nested.push(node);
      });
      const outermost = nested.filter(
        (candidate) => !nested.some((other) => other !== candidate && contains2(other, candidate))
      );
      for (const element of outermost) {
        const inner = canonical(element);
        if (inner !== null) found.push(inner);
      }
    }
  }
  return found;
}
function contains2(outer, inner) {
  const outerStart = outer.start ?? -1;
  const outerEnd = outer.end ?? -1;
  const innerStart = inner.start ?? -1;
  return innerStart > outerStart && innerStart < outerEnd;
}
function shapesOf(file, source) {
  const ast = parseModule(source, file);
  if (ast === null) return [];
  const shapes = [];
  walk(ast.program, (node) => {
    if (node.type !== "JSXElement") return;
    const shape = canonical(node);
    if (shape === null || shape.size < MIN_SIZE) return;
    shapes.push({
      hash: shape.text,
      file,
      line: node.loc?.start.line ?? 1,
      size: shape.size
    });
  });
  return shapes;
}
function shapeReport(corpora) {
  const known = /* @__PURE__ */ new Map();
  for (const entry of corpora.library) {
    for (const shape of shapesOf(entry.file, entry.source)) {
      if (!known.has(shape.hash)) known.set(shape.hash, { component: entry.component, file: entry.file });
    }
  }
  const handRolled = [];
  const seen = /* @__PURE__ */ new Set();
  const byHash = /* @__PURE__ */ new Map();
  for (const entry of corpora.app) {
    for (const shape of shapesOf(entry.file, entry.source)) {
      const existing = known.get(shape.hash);
      if (existing !== void 0 && existing.file !== shape.file) {
        const at = `${shape.file}:${shape.line}`;
        if (!seen.has(at)) {
          seen.add(at);
          handRolled.push({
            file: shape.file,
            line: shape.line,
            component: existing.component,
            definedIn: existing.file
          });
        }
      }
      const group2 = byHash.get(shape.hash) ?? [];
      group2.push(shape);
      byHash.set(shape.hash, group2);
    }
  }
  const repeated = [];
  for (const [hash, group2] of byHash) {
    const files = [...new Set(group2.map((shape) => shape.file))].sort();
    if (files.length < QUORUM2) continue;
    const existing = known.get(hash);
    repeated.push({
      hash,
      files,
      size: group2[0].size,
      existsAs: existing === void 0 ? null : { component: existing.component, definedIn: existing.file }
    });
  }
  repeated.sort((a, b) => b.size * b.files.length - a.size * a.files.length);
  return { handRolled, repeated };
}

// src/sources/reference.ts
import { readFile as readFile22 } from "node:fs/promises";
function referenceSource(filePath) {
  return {
    kind: "reference",
    async describe() {
      const source = await readFile22(filePath, "utf8").catch(() => null);
      if (source === null) return null;
      const shape = shapeOf(source);
      if (shape === null) return null;
      const { holder, ...rest } = shape;
      return { kind: "reference", ...rest, ...holder === null ? {} : { holder } };
    }
  };
}

// src/sources/knowledge.ts
import { readFile as readFile23 } from "node:fs/promises";
var COMPONENT2 = /<([A-Z][\w]*)/g;
var PROP = /<([A-Z][\w]*)\s+([^>]*)>/g;
var ATTRIBUTE = /([a-zA-Z][\w]*)=['"]([^'"]+)['"]/g;
function knowledgeSource(knowledge) {
  return {
    kind: "knowledge",
    async describe(target) {
      if (knowledge.fragments.length === 0) return null;
      const source = await readFile23(target, "utf8").catch(() => null);
      const fragments = source === null ? knowledge.fragments : retrieve(source, knowledge, { maxFragments: 8, maxChars: 8e3 });
      if (fragments.length === 0) return null;
      const components = [];
      const props2 = {};
      for (const fragment of fragments) {
        for (const match of fragment.body.matchAll(COMPONENT2)) {
          const name = match[1];
          if (!components.includes(name)) components.push(name);
        }
        if (fragment.generated === true) continue;
        for (const element of fragment.body.matchAll(PROP)) {
          const name = element[1];
          for (const attribute of element[2].matchAll(ATTRIBUTE)) {
            const forComponent = props2[name] ??= {};
            const values = forComponent[attribute[1]] ??= [];
            if (!values.includes(attribute[2])) values.push(attribute[2]);
          }
        }
      }
      if (components.length === 0) return null;
      return { kind: "knowledge", components, pattern: [], props: props2 };
    }
  };
}

// src/sources/storybook.ts
import { readdir as readdir11, readFile as readFile24 } from "node:fs/promises";
import { join as join19 } from "node:path";
var STORIES = /\.stories\.[jt]sx?$/;
async function storyFiles(dir, depth = 2) {
  const entries = await readdir11(dir, { withFileTypes: true }).catch(() => null);
  if (entries === null) return [];
  const found = [];
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const path = join19(dir, entry.name);
    if (entry.isDirectory()) {
      if (depth > 0) found.push(...await storyFiles(path, depth - 1));
      continue;
    }
    if (STORIES.test(entry.name)) found.push(path);
  }
  return found;
}
function componentOf(source) {
  const ast = parseModule(source);
  if (ast === null) return null;
  let name = null;
  walk(ast.program, (node) => {
    if (node.type !== "ObjectProperty" || node.computed) return;
    const key = node.key;
    const keyName = key.type === "Identifier" ? key.name : null;
    if (keyName !== "component") return;
    if (node.value.type === "Identifier") name = node.value.name;
  });
  return name;
}
function argsOf(source) {
  const ast = parseModule(source);
  if (ast === null) return {};
  const found = {};
  walk(ast.program, (node) => {
    if (node.type !== "ObjectProperty" || node.computed) return;
    const key = node.key;
    if ((key.type === "Identifier" ? key.name : null) !== "args") return;
    if (node.value.type !== "ObjectExpression") return;
    for (const property of node.value.properties) {
      if (property.type !== "ObjectProperty" || property.computed) continue;
      const propertyKey2 = property.key;
      const propName = propertyKey2.type === "Identifier" ? propertyKey2.name : propertyKey2.type === "StringLiteral" ? propertyKey2.value : null;
      if (propName === null) continue;
      if (property.value.type !== "StringLiteral") continue;
      const values = found[propName] ??= [];
      if (!values.includes(property.value.value)) values.push(property.value.value);
    }
  });
  return found;
}
var TOKEN = /^[a-z0-9][\w-]*$/i;
var CONTENT_PROPS = /* @__PURE__ */ new Set([
  "name",
  "label",
  "title",
  "subtitle",
  "description",
  "placeholder",
  "value",
  "defaultValue",
  "text",
  "children",
  "id",
  "key",
  "src",
  "alt",
  "href",
  "to",
  "aria-label",
  "ariaLabel",
  "data-testid",
  "testId"
]);
function enumerable(byProp) {
  const kept = {};
  for (const [prop, values] of Object.entries(byProp)) {
    if (CONTENT_PROPS.has(prop)) continue;
    if (values.length < 2) continue;
    if (!values.every((value) => value.length <= 24 && TOKEN.test(value))) continue;
    kept[prop] = values;
  }
  return kept;
}
function storybookSource(dir, options = {}) {
  return {
    kind: "storybook",
    async describe() {
      const files = await storyFiles(dir, options.depth ?? 2);
      if (files.length === 0) return null;
      const components = [];
      const props2 = {};
      for (const file of files) {
        const source = await readFile24(file, "utf8").catch(() => null);
        if (source === null) continue;
        const component = componentOf(source);
        if (component === null) continue;
        if (!components.includes(component)) components.push(component);
        const args = argsOf(source);
        if (Object.keys(args).length > 0) props2[component] = { ...props2[component], ...args };
      }
      if (components.length === 0) return null;
      for (const [component, byProp] of Object.entries(props2)) {
        props2[component] = enumerable(byProp);
        if (Object.keys(props2[component]).length === 0) delete props2[component];
      }
      return { kind: "storybook", components, pattern: [], props: props2 };
    }
  };
}

// src/sources/adapter.ts
async function resolveSource(target, options) {
  const cascade = [];
  if (options.reference !== void 0) cascade.push(referenceSource(options.reference));
  if (options.knowledge !== void 0) cascade.push(knowledgeSource(options.knowledge));
  if (options.storybookDir !== void 0) cascade.push(storybookSource(options.storybookDir));
  cascade.push(neighbourSource());
  for (const source of cascade) {
    const model = await source.describe(target).catch(() => null);
    if (model !== null) return model;
  }
  return null;
}
function statedConventions(model) {
  if (model === null || model.heuristic === true) return {};
  return model.kind === "reference" || model.kind === "knowledge" ? model.props : {};
}

// src/core/coverage.ts
import { readFile as readFile25 } from "node:fs/promises";
var SX = /\bsx=\{/;
var INLINE2 = /\bstyle=\{\{/;
var CLASSES = /\b(?:className|class)=["'{]/;
var TEMPLATE = /\b(?:styled|css|createGlobalStyle|keyframes)\b[\s\S]{0,40}?`/;
async function coverageOf(rootDir, files) {
  const config = await readConfig(rootDir);
  const packages = applyConfig(await cachedPackages(rootDir), config);
  const prefer = config?.prefer ?? [];
  const knowledge = await parseKnowledge((await knowledgeDir(rootDir)).dir).catch(() => null);
  const found = {
    given: files.length,
    read: 0,
    onAChain: 0,
    packages: packages.length,
    styledWith: { sx: 0, style: 0, classes: 0, template: 0 },
    stated: knowledge?.fragments.length ?? 0
  };
  for (const file of files) {
    if (resolveChain(file, packages, prefer).length > 0) found.onAChain++;
    const source = await readFile25(file, "utf8").catch(() => null);
    if (source === null) continue;
    found.read++;
    if (SX.test(source)) found.styledWith.sx++;
    if (INLINE2.test(source)) found.styledWith.style++;
    if (CLASSES.test(source)) found.styledWith.classes++;
    if (TEMPLATE.test(source)) found.styledWith.template++;
  }
  return found;
}
function sayCoverage(found) {
  const said = [];
  const { styledWith: styled } = found;
  said.push(`No findings. ${found.read} of ${found.given} file(s) read.`);
  if (found.read === 0) {
    said.push("None of them could be read, so nothing was checked at all.");
    return said;
  }
  if (found.onAChain === 0) {
    said.push(
      found.packages === 0 ? "No package was detected, so imports and deprecated usage did not run." : `No file belongs to any of the ${found.packages} detected package(s), so imports and deprecated usage did not run.`
    );
    said.push("That is a detection gap, not a clean result \u2014 `uic scan` shows what was looked for.");
  } else if (found.onAChain < found.read) {
    said.push(
      `${found.onAChain} of them belong to a detected package; imports and deprecated usage did not run on the other ${found.read - found.onAChain}.`
    );
  }
  const seen = styled.sx + styled.style;
  if (seen === 0 && (styled.classes > 0 || styled.template > 0)) {
    const how = [
      ...styled.classes > 0 ? [`${styled.classes} with class strings`] : [],
      ...styled.template > 0 ? [`${styled.template} with CSS in template literals`] : []
    ].join(" and ");
    said.push(
      `The style check reads \`sx\` and inline \`style\` objects, and no file uses either \u2014 ${how}.`
    );
    said.push("Those are out of reach of a per-file AST check by construction, not clean.");
  } else if (seen > 0) {
    const how = [
      ...styled.sx > 0 ? [`${styled.sx} with \`sx\``] : [],
      ...styled.style > 0 ? [`${styled.style} with inline \`style\``] : []
    ].join(" and ");
    said.push(`The style check read ${how}, and found no hardcoded value in them.`);
  }
  if (found.stated === 0) {
    said.push(
      `Nothing is written down in ${KNOWLEDGE_DIR}/, so the page rules and substitution checks had nothing to apply.`
    );
  }
  return said;
}

// src/cli/hook.ts
import { dirname as dirname14, relative as relative11, resolve as resolve8 } from "node:path";
import { readFile as readFile29 } from "node:fs/promises";

// src/ai/settled.ts
import { readFile as readFile26, writeFile as writeFile5 } from "node:fs/promises";
import { join as join20 } from "node:path";
var WINDOW = 6e4;
var settled = async (rootDir, filePath, options = {}) => {
  try {
    return await decide(rootDir, filePath, options);
  } catch {
    return true;
  }
};
var decide = async (rootDir, filePath, options) => {
  const now = options.now ?? (() => Date.now());
  const window = options.windowMs ?? WINDOW;
  const file = join20(cacheRoot(), projectKey(rootDir), "advised.json");
  const raw = await readFile26(file, "utf8").catch(() => null);
  let seen = {};
  if (raw !== null) {
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === "object" && parsed !== null) seen = parsed;
    } catch {
    }
  }
  const at = now();
  const last = seen[filePath];
  if (typeof last === "number" && at - last < window) return false;
  seen[filePath] = at;
  const recent = Object.entries(seen).filter(([, time]) => at - time < window * 20);
  const owned = await ownedDir(projectKey(rootDir));
  if (owned === null) return true;
  await writeFile5(file, JSON.stringify(Object.fromEntries(recent)), "utf8").catch(() => void 0);
  return true;
};

// src/sources/pattern-cache.ts
import { readFile as readFile27, stat as stat11, writeFile as writeFile6 } from "node:fs/promises";
import { dirname as dirname13, join as join21 } from "node:path";
var CACHE_VERSION3 = 2;
var fileIn3 = (dir) => join21(dir, "patterns.json");
var mtimeOf3 = (path) => stat11(path).then(
  (info) => info.mtimeMs,
  () => null
);
async function cachedPattern(rootDir, target, kind) {
  const dir = await cacheDirFor(rootDir);
  const key = `${kind}|${dirname13(target)}`;
  if (dir !== null) {
    const raw2 = await readFile27(fileIn3(dir), "utf8").catch(() => null);
    if (raw2 !== null) {
      try {
        const parsed = JSON.parse(raw2);
        const entry = parsed.version === CACHE_VERSION3 ? parsed.kinds[key] : void 0;
        if (entry !== void 0) {
          const still = await Promise.all(
            Object.entries(entry.from).map(async ([path, when]) => await mtimeOf3(path) === when)
          );
          if (still.length > 0 && still.every(Boolean)) return entry.pattern;
        }
      } catch {
      }
    }
  }
  const derived = await patternOf2(target).catch(() => null);
  if (derived === null || dir === null) return derived;
  const from = {};
  for (const path of derived.family) {
    const when = await mtimeOf3(path);
    if (when !== null) from[path] = when;
  }
  const raw = await readFile27(fileIn3(dir), "utf8").catch(() => null);
  let existing = { version: CACHE_VERSION3, kinds: {} };
  if (raw !== null) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed.version === CACHE_VERSION3 && typeof parsed.kinds === "object") existing = parsed;
    } catch {
    }
  }
  existing.kinds[key] = { from, pattern: derived };
  await writeFile6(fileIn3(dir), JSON.stringify(existing), "utf8").catch(() => void 0);
  return derived;
}

// src/cli/touched.ts
import { readFile as readFile28 } from "node:fs/promises";
function rangesOf(source, text) {
  if (text === "") return [];
  const found = [];
  const height = text.split("\n").length - 1;
  let at = source.indexOf(text);
  while (at >= 0 && found.length < 64) {
    const line = source.slice(0, at).split("\n").length;
    found.push({ from: line, to: line + height });
    at = source.indexOf(text, at + 1);
  }
  return found;
}
async function touchedBy(toolName, input, filePath) {
  if (toolName === "Write" || toolName === "NotebookEdit") return null;
  if (typeof input !== "object" || input === null) return null;
  const written = [];
  const one = input;
  if (typeof one.new_string === "string") written.push(one.new_string);
  if (Array.isArray(one.edits)) {
    for (const edit of one.edits) {
      if (typeof edit?.new_string === "string") written.push(edit.new_string);
    }
  }
  if (written.length === 0) return null;
  const source = await readFile28(filePath, "utf8").catch(() => null);
  if (source === null) return null;
  const ranges = written.flatMap((text) => rangesOf(source, text));
  return ranges.length === 0 ? null : ranges;
}
var within = (touched, line) => touched === null || touched.some((range) => line >= range.from && line <= range.to);

// src/cli/hook.ts
var WRITE_TOOLS = /* @__PURE__ */ new Set(["Write", "Edit", "MultiEdit", "NotebookEdit"]);
var CHECKABLE3 = /\.(?:tsx?|jsx?|mts|cts|html|vue|svelte)$/;
function filePathFrom(payload) {
  if (typeof payload.tool_name !== "string" || !WRITE_TOOLS.has(payload.tool_name)) return null;
  const path = payload.tool_input?.file_path;
  if (typeof path !== "string" || path === "") return null;
  return CHECKABLE3.test(path) ? path : null;
}
async function hookResponse(stdin) {
  let payload;
  try {
    const parsed = JSON.parse(stdin);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
    payload = parsed;
  } catch {
    return null;
  }
  const filePath = filePathFrom(payload);
  if (filePath === null) return null;
  const absolute = resolve8(typeof payload.cwd === "string" ? payload.cwd : ".", filePath);
  const root = await findProjectRoot(dirname14(absolute)) ?? (typeof payload.cwd === "string" ? payload.cwd : null);
  if (root === null) return null;
  const findings = await analyzeProject(root, [absolute]).catch(() => []);
  await record(root, findings, { rootDir: root });
  const touched = await touchedBy(
    payload.tool_name,
    payload.tool_input,
    absolute
  ).catch(() => null);
  const said = findings.filter((finding) => within(touched, finding.line));
  if (said.length === 0) {
    if (!await settled(root, absolute)) return null;
    const { said: deviations, derived } = await deviationsFromContract(root, absolute).catch(
      () => ({ said: [], derived: null })
    );
    if (deviations.length === 0) return null;
    await record(
      root,
      deviations.map((one) => ({
        file: absolute,
        line: 1,
        level: "page-pattern",
        message: one
      })),
      { rootDir: root }
    );
    return {
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext: [
          derived === null ? "ui-consistency: this screen has left the contract for its kind:" : "ui-consistency: this screen differs from the other screens of its kind here",
          // Where the family came from, and the names. An agent handed a family
          // it can see is nonsense will say so; one handed a bare assertion
          // cannot (#255).
          ...derived === null ? [] : [`(${provenance(root, derived)}, and it fails nothing):`],
          "",
          ...deviations.map((one) => `- ${one}`),
          "",
          derived === null ? "Fix them in this turn, or say which are deliberate." : "Follow them where they fit, and say so where this screen is deliberately different."
        ].join("\n")
      }
    };
  }
  const text = said.map((finding) => formatFinding({ ...finding, file: relative11(root, finding.file) })).join("\n\n");
  return {
    hookSpecificOutput: {
      hookEventName: "PostToolUse",
      additionalContext: `ui-consistency found code that does not match this project's own design system:

${text}

Fix them in this turn.`
    }
  };
}
function provenance(root, contract) {
  const names = contract.family.map((one) => relative11(root, one));
  if (contract.from === "pattern") {
    return `read just now from the ${names.length} screens the project's pattern file names`;
  }
  return contract.from === "routes" ? `derived just now from the ${names.length} screens the route table registers beside it \u2014 nobody approved it` : `derived just now from files in its folder \u2014 ${names.join(", ")} \u2014 nobody approved it`;
}
async function deviationsFromContract(root, file) {
  const nothing = { said: [], derived: null };
  const source = await readFile29(file, "utf8").catch(() => null);
  if (source === null) return nothing;
  const approved = [];
  for (const path of await contractsFor(root)) {
    const raw = await readFile29(path, "utf8").catch(() => null);
    if (raw === null) continue;
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      continue;
    }
    if (isContract(parsed)) approved.push(parsed);
  }
  const holder = regionsOf(source, templateKind(file) ?? void 0)?.holder ?? null;
  const matching = contractsForScreen(approved, holder);
  const fresh = matching.length === 0 && holder !== null ? await cachedPattern(root, file, holder).catch(() => null) : null;
  const contracts = fresh === null ? matching : [fresh];
  const said = [];
  for (const contract of contracts) {
    const deviations = contractDeviations(relative11(root, file), source, contract);
    if (deviations === null) return nothing;
    if (deviations.length === 0) return nothing;
    said.push(...deviations.map((one) => one.message));
  }
  return { said, derived: fresh };
}

// src/cli/session.ts
import { readdir as readdir12, open } from "node:fs/promises";
import { join as join22 } from "node:path";

// src/version.ts
var VERSION = "0.14.100";

// src/cli/session.ts
function shapeFor(env, context) {
  if (env["CURSOR_PLUGIN_ROOT"] !== void 0) return { additional_context: context };
  if (env["CLAUDE_PLUGIN_ROOT"] !== void 0 && env["COPILOT_CLI"] === void 0) {
    return { hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: context } };
  }
  return { additionalContext: context };
}
var HEAD = 512;
var MAX_FILES = 12;
async function firstBytes(path) {
  const handle = await open(path, "r").catch(() => null);
  if (handle === null) return null;
  try {
    const buffer = Buffer.alloc(HEAD);
    const { bytesRead } = await handle.read(buffer, 0, HEAD, 0);
    return buffer.subarray(0, bytesRead).toString("utf8");
  } catch {
    return null;
  } finally {
    await handle.close().catch(() => void 0);
  }
}
var STANDING = [
  "ui-consistency \u2014 when the work is about screens, this is the order. Do not wait to be asked.",
  "",
  "1. ui-consistency:pattern \u2014 BEFORE writing or changing a screen. It reads what",
  "   screens of that kind already look like here and writes it down. A screen",
  "   written first and corrected after is a screen somebody has to be persuaded",
  "   to change.",
  "2. ui-consistency:decide \u2014 where pattern finds fewer than three screens of the",
  "   kind. It asks; it does not draft. The first screen of a kind is a decision,",
  "   not a derivation.",
  "3. ui-consistency:screen \u2014 writing one screen against what pattern established.",
  "   ui-consistency:rollout \u2014 the same change across many; it queues them and",
  "   verifies the whole set rather than trusting thirty separate turns.",
  "4. ui-consistency:verify \u2014 before handing the work over.",
  "   ui-consistency:review \u2014 a second opinion on one screen, when asked.",
  "5. ui-consistency:reach \u2014 when you cannot tell whether this project is clean or",
  "   this tool is blind here. Those look identical and are not.",
  "",
  "Nothing is spent until UI work starts. This message is the whole of what a",
  "session costs."
].join("\n");
async function sessionContext(rootDir) {
  const { dir, legacy } = await knowledgeDir(rootDir);
  const entries = await readdir12(dir).catch(() => null);
  const files = (entries ?? []).filter((name) => /\.md$/i.test(name)).sort();
  const said = [STANDING];
  const versions = /* @__PURE__ */ new Set();
  for (const name of files.slice(0, MAX_FILES)) {
    const head = await firstBytes(join22(dir, name));
    if (head === null) continue;
    const version = generatedVersion(head);
    if (version !== null && version !== VERSION) versions.add(version);
  }
  if (legacy) said.push(`ui-consistency: ${MOVED}`);
  if (versions.size > 0) {
    said.push(
      [
        `ui-consistency: the generated part of ${KNOWLEDGE_DIR}/ was written by`,
        `plugin ${[...versions].sort().join(", ")}; this is ${VERSION}.`,
        "Nothing generates those files any more. They are a stored copy of what the",
        `code says, which is the thing that goes stale \u2014 keep whatever in them was`,
        `intent, in ${KNOWLEDGE_DIR}/decisions/, and delete the rest.`
      ].join(" ")
    );
  }
  return said.join("\n\n");
}
async function sessionResponse(stdin) {
  let cwd = process.cwd();
  try {
    const parsed = JSON.parse(stdin);
    const payload = parsed;
    if (typeof payload?.cwd === "string" && payload.cwd !== "") cwd = payload.cwd;
  } catch {
  }
  const context = await sessionContext(cwd).catch(() => null);
  if (context === null) return null;
  return shapeFor(process.env, context);
}

// src/cli/prompt.ts
var ABOUT_SCREENS = /\b(screens?|pages?|dialogs?|modals?|drawers?|panels?|widgets?|forms?|grids?|tables?|layouts?|components?|views?|ui)\b/i;
var A_WHOLE_SET = /\b(all (?:the |of )?|every|each of|the rest|remaining|across (?:the|all|every)|throughout|everywhere|one by one|in bulk|consistent(?:ly)? across|\d{2,})\b/i;
async function promptContext(rootDir, text) {
  if (!ABOUT_SCREENS.test(text)) return null;
  const { patterns: patterns2 } = await patternFiles(rootDir).catch(() => ({ patterns: [] }));
  if (patterns2.length === 0) {
    return [
      `ui-consistency: this project has written no patterns down (${KNOWLEDGE_DIR}/patterns/).`,
      "",
      ...ESTABLISH_IT,
      ...manyOfThem(text)
    ].join("\n");
  }
  const said = [`ui-consistency: what this project has written down, before you write.`, ""];
  for (const one of patterns2.slice(0, MAX_PATTERNS)) {
    said.push(`  ${describe2(one)}${await freshness(rootDir, one)}`);
  }
  if (patterns2.length > MAX_PATTERNS) {
    said.push(`  \u2026 and ${patterns2.length - MAX_PATTERNS} more in ${KNOWLEDGE_DIR}/patterns/`);
  }
  said.push(
    "",
    "Read the one for the kind you are about to touch before writing anything.",
    "Where none of them covers that kind:",
    "",
    ...ESTABLISH_IT,
    ...manyOfThem(text)
  );
  return said.join("\n");
}
var ESTABLISH_IT = [
  "Establish it first, from the code you are about to read anyway:",
  "",
  "  1. Find a screen of that kind that already exists here.",
  "  2. ui-consistency:pattern \u2014 derive what that family agrees on and write it",
  "     down: `uic pattern <that screen> --establish`.",
  "     Do not ask the user for a reference; take the screen from step 1.",
  "  3. Fill in the parts the file says are still to be written, then build from it.",
  "",
  "Where there are fewer than three screens of the kind, nothing is derived and",
  "ui-consistency:decide records what is decided instead \u2014 a pattern of one is",
  "that screen's particulars turned into a rule for every screen after it.",
  "",
  "Doing any of this afterwards means arguing with code that already works."
];
var manyOfThem = (text) => A_WHOLE_SET.test(text) ? [
  "",
  "This prompt names a set, not one screen. If it is more than two or three files,",
  "that is a rollout: ui-consistency:rollout. It keeps the queue on disk, works one",
  "file per turn against the contract re-read each time, and verifies the whole set",
  "at the end \u2014 which is what stops file thirty drifting toward the last file you",
  'looked at instead of the pattern, and what makes "27 of 30" auditable.'
] : [];
var MAX_PATTERNS = 12;
var describe2 = (one) => [one.name, one.surface ?? "\u2014", one.holder ?? "\u2014", `${one.members.length} files`].join("  ");
async function freshness(rootDir, one) {
  const stale = await staleIn(rootDir, one).catch(() => []);
  if (stale.length === 0) return "";
  const gone = stale.filter((each) => each.why === "gone").length;
  const changed = stale.length - gone;
  const parts = [
    ...changed > 0 ? [`${changed} changed`] : [],
    ...gone > 0 ? [`${gone} gone`] : []
  ];
  const what = one.derived ? "run `uic pattern <one of them> --refresh` first" : "a person wrote it, so read it against `uic pattern <one of them>` before trusting it";
  return `  (${parts.join(", ")} since it was read \u2014 ${what})`;
}
async function promptResponse(stdin) {
  let cwd = process.cwd();
  let text = "";
  try {
    const parsed = JSON.parse(stdin);
    const payload = parsed;
    if (typeof payload?.cwd === "string" && payload.cwd !== "") cwd = payload.cwd;
    for (const key of ["prompt", "user_input"]) {
      const value = payload?.[key];
      if (typeof value === "string" && value !== "") text = value;
    }
  } catch {
    return null;
  }
  if (text === "") return null;
  return promptContext(cwd, text).catch(() => null);
}

// src/cli/index.ts
import { pathToFileURL } from "node:url";
function inventoryReader(rootDir) {
  const inventories = /* @__PURE__ */ new Map();
  return async (chain) => {
    const key = chain.map((layer) => layer.name).join(">");
    let inventory2 = inventories.get(key);
    if (inventory2 === void 0) {
      inventory2 = await cachedInventory(rootDir, chain);
      inventories.set(key, inventory2);
    }
    return inventory2;
  };
}
async function checkProject(rootDir, files, options = {}) {
  const config = await readConfig(rootDir);
  const packages = applyConfig(await cachedPackages(rootDir), config);
  if (packages.length === 0) return [];
  const prefer = config?.prefer ?? [];
  const inventoryFor = inventoryReader(rootDir);
  const violations = [];
  for (const file of files) {
    const chain = resolveChain(file, packages, prefer);
    if (chain.length === 0) continue;
    const source = await readFile30(file, "utf8").catch(() => null);
    if (source === null) continue;
    violations.push(...checkSource(file, source, chain, await inventoryFor(chain)));
  }
  if (options.withinLayer === true) return violations;
  return violations.filter((violation) => violation.withinOwnLayer !== true);
}
async function analyzeProject(rootDir, files, options = {}) {
  const config = await readConfig(rootDir);
  const packages = applyConfig(await cachedPackages(rootDir), config);
  const prefer = config?.prefer ?? [];
  const knowledge = await parseKnowledge((await knowledgeDir(rootDir)).dir);
  const inventoryFor = inventoryReader(rootDir);
  const models = /* @__PURE__ */ new Map();
  const sourceFor = async (dir, file) => {
    if (models.has(dir)) return models.get(dir) ?? null;
    const model = await resolveSource(file, { knowledge, storybookDir: rootDir }).catch(() => null);
    models.set(dir, model);
    return model;
  };
  const findings = [];
  for (const file of files) {
    const chain = resolveChain(file, packages, prefer);
    const source = await readFile30(file, "utf8").catch(() => null);
    if (source === null) continue;
    const model = await sourceFor(dirname15(file), file);
    const result = await runEngine(file, source, {
      chain,
      inventory: await inventoryFor(chain),
      knowledge,
      conventions: statedConventions(model),
      ...model === null ? {} : { conventionsFrom: model.kind },
      withinLayer: options.withinLayer === true
    });
    findings.push(...result.tier1);
  }
  return findings;
}
async function adviseProject(rootDir, file) {
  const knowledge = await parseKnowledge((await knowledgeDir(rootDir)).dir);
  const source = await readFile30(file, "utf8").catch(() => null);
  if (source === null) return null;
  const neighbours = await neighbourSource().describe(file).catch(() => null);
  const usage = await observeUsage(file).catch(() => null);
  const pair = await pairOf(file).catch(() => null);
  const markup = pair === null ? null : await markupOf(pair.identity, source).catch(() => null);
  return buildAdvice({
    filePath: file,
    source,
    ...markup === null ? {} : { markup },
    knowledge,
    ...usage === null ? {} : { usage },
    ...neighbours === null ? {} : {
      neighbours: {
        ...neighbours.holder === void 0 ? {} : { holder: neighbours.holder },
        components: neighbours.components
      }
    }
  });
}
async function review(rootDir, args) {
  const files = args.filter((arg) => !arg.startsWith("-"));
  if (files.length === 0) {
    console.error("Usage: uic review <file...>");
    return 1;
  }
  const absolute = files.map((file) => resolve9(rootDir, file));
  const tier1 = await analyzeProject(rootDir, absolute);
  for (const finding of tier1) {
    console.log(`${formatFinding({ ...finding, file: relative12(rootDir, finding.file) })}
`);
  }
  if (tier1.length > 0) return 1;
  let said = false;
  for (const file of absolute) {
    const advice = await adviseProject(rootDir, file);
    if (advice === null) continue;
    said = true;
    console.log(advice);
  }
  if (!said) {
    const knowledge = await parseKnowledge((await knowledgeDir(rootDir)).dir);
    if (knowledge.fragments.length === 0) {
      console.error(`Nothing to say: no rules in ${KNOWLEDGE_DIR}/, and the screens beside`);
      console.error("this one do not agree on enough to be worth reporting.");
      console.error("Write one Markdown file per part of the design system, one rule per heading.");
    }
  }
  return 0;
}
async function pattern(rootDir, args) {
  const save = args.includes("--save");
  const establish = args.includes("--establish");
  const refresh = args.includes("--refresh");
  const at = args.indexOf("--kind");
  const wanted = at < 0 ? void 0 : args[at + 1];
  const file = args.find((arg, index) => !arg.startsWith("-") && (at < 0 || index !== at + 1));
  if (establish && refresh) {
    console.error("`--establish` writes a pattern file and `--refresh` updates one; pick one.");
    return 1;
  }
  const decisions = await readDecisions(rootDir);
  const decided = wanted === void 0 ? void 0 : decisions.find((one) => one.kind === wanted);
  if (wanted !== void 0 && decided === void 0) {
    console.error(`Nothing is written down about "${wanted}".`);
    console.error(`Add ${KNOWLEDGE_DIR}/decisions/${wanted}.md naming the canonical screen.`);
    return 1;
  }
  if (decided?.stale != null) {
    console.error(`${relative12(rootDir, decided.file)} points at ${decided.stale}, which is gone.`);
    return 1;
  }
  const reference = decided?.canon ?? (file === void 0 ? void 0 : resolve9(rootDir, file));
  if (reference === void 0) {
    console.error("Usage: uic pattern <reference-screen> [--save|--establish|--refresh]");
    console.error("   or: uic pattern --kind <kind> [--save]   (from a decisions file)");
    return 1;
  }
  if (refresh) return refreshFile(rootDir, reference, decided?.kind);
  const found = await patternOf2(reference, { byHolder: true });
  if (found === null) {
    console.error("No pattern found: fewer than three screens of this kind to compare.");
    console.error("Decide it here, and this screen becomes the first of its kind.");
    console.error("ui-consistency:decide walks the anatomy and records the decision.");
    return establish ? 1 : 0;
  }
  const stated2 = decided ?? decisions.find((one) => one.kind === found.kind);
  const digest = {
    ...found,
    family: found.family.map((path2) => relative12(rootDir, path2)),
    ...stated2 === void 0 || stated2.statements.length === 0 ? {} : { decided: { kind: stated2.kind, from: relative12(rootDir, stated2.file), statements: stated2.statements } }
  };
  if (establish) return establishPattern(rootDir, found, reference, decided?.kind);
  if (!save) {
    console.log(JSON.stringify(digest, null, 2));
    return 0;
  }
  const path = contractPathFor(rootDir, decided?.kind ?? found.kind ?? "screens");
  if (await ownedDir(projectKey(rootDir)) === null) {
    console.error("Cannot write the contract: the cache directory is not one this user owns.");
    return 1;
  }
  await writeFile7(path, `${JSON.stringify(digest, null, 2)}
`, "utf8");
  console.log(path);
  return 0;
}
async function establishPattern(rootDir, found, reference, decidedKind) {
  const name = slug2(decidedKind ?? found.kind ?? "screens");
  const path = join23(rootDir, KNOWLEDGE_DIR, "patterns", `${name}.md`);
  const { dir: reading, legacy } = await knowledgeDir(rootDir, "patterns");
  const existing = [path, join23(reading, `${name}.md`)];
  if (legacy) console.error(`ui-consistency: ${MOVED}`);
  for (const each of existing) {
    if (await stat12(each).catch(() => null) === null) continue;
    console.error(`${relative12(rootDir, each)} already exists, and was not overwritten.`);
    console.error("If it looks stale, `uic pattern <screen> --refresh` brings its counts up to");
    console.error("date and leaves every sentence in it alone.");
    return 1;
  }
  const rendered = renderPattern(found, {
    name,
    observed: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
    files: found.family.map((one) => relative12(rootDir, one)),
    reference: relative12(rootDir, reference)
  });
  await mkdir2(dirname15(path), { recursive: true });
  await writeFile7(path, rendered, "utf8");
  console.log(relative12(rootDir, path));
  return 0;
}
async function refreshFile(rootDir, reference, decidedKind) {
  const { patterns: patterns2, legacy } = await patternFiles(rootDir);
  if (legacy) console.error(`ui-consistency: ${MOVED}`);
  const { dir } = await knowledgeDir(rootDir, "patterns");
  const where2 = relative12(rootDir, reference);
  const covering = decidedKind === void 0 ? patternForScreen(patterns2, where2, await holderOf2(reference)) : patterns2.find((one) => one.name === slug2(decidedKind)) ?? null;
  if (covering === null) {
    console.error(`No pattern file covers ${where2}, so there is nothing to refresh.`);
    console.error("`uic patterns <screen>` says why, and `uic pattern <screen> --establish`");
    console.error("writes the first one.");
    return 1;
  }
  const path = join23(dir, covering.file);
  const raw = await readFile30(path, "utf8").catch(() => null);
  if (raw === null) {
    console.error(`Cannot read ${relative12(rootDir, path)}.`);
    return 1;
  }
  if (!covering.derived) {
    console.error(`${relative12(rootDir, path)} carries no \`derived: true\`, so a person wrote it.`);
    console.error("Nothing in it is safe to regenerate: read it against `uic pattern <screen>`");
    console.error("and change what you decide should change.");
    return 1;
  }
  const found = await patternOf2(reference, { byHolder: true, ignoringPattern: covering.name });
  if (found === null) {
    console.error(`${relative12(rootDir, path)} was left as it is.`);
    console.error("Fewer than three screens of this kind can be read now, so there is nothing");
    console.error("to count agreement over. That is a fact about the code today, and the");
    console.error("pattern may well be what should hold \u2014 read it rather than deleting it.");
    return 1;
  }
  const { text, changed } = refreshPattern(raw, found, {
    name: covering.name,
    observed: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
    files: found.family.map((one) => relative12(rootDir, one)),
    reference: where2
  });
  if (changed.length === 0) {
    console.log(`${relative12(rootDir, path)} is already what the code says. Nothing was written.`);
    return 0;
  }
  await writeFile7(path, text, "utf8");
  console.log(relative12(rootDir, path));
  for (const one of changed) console.log(`  rewritten: ${one}`);
  console.log("  kept: every other section, as written");
  console.log(`  counted around: ${where2}`);
  return 0;
}
async function holderOf2(screen) {
  const pair = await pairOf(screen);
  const identity = pair?.identity ?? screen;
  const own = await readFile30(identity, "utf8").catch(() => null);
  if (own === null) return null;
  const markup = pair === null ? { path: screen, source: own } : await markupOf(identity, own);
  if (markup === null) return null;
  return regionsOf(markup.source, templateKind(markup.path) ?? void 0)?.holder ?? null;
}
var slug2 = (kind) => kind.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase() || "screens";
async function diff(rootDir, args) {
  const at = args.indexOf("--contract");
  const contractPath = at < 0 ? void 0 : args[at + 1];
  const files = args.filter((arg, index) => !arg.startsWith("-") && index !== at + 1);
  const unknown = args.filter((arg) => arg.startsWith("-") && arg !== "--contract");
  if (contractPath === void 0 || contractPath.startsWith("-") || files.length === 0 || unknown.length > 0) {
    if (unknown.length > 0) console.error(`Unknown option: ${unknown.join(", ")}`);
    console.error("Usage: uic diff --contract <contract.json> <file...>");
    return 1;
  }
  const raw = await readFile30(resolve9(rootDir, contractPath), "utf8").catch(() => null);
  if (raw === null) {
    console.error(`Cannot read the contract: ${contractPath}`);
    return 1;
  }
  let parsed = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
  }
  const pattern2 = isContract(parsed) ? null : parsePattern(basename8(contractPath), raw);
  if (pattern2 !== null && pattern2.structure.length === 0 && pattern2.props.length === 0) {
    console.error(
      `${contractPath} is neither the JSON \`uic pattern\` emits nor a pattern file with a \`## Structure\` or \`## Props\` section.`
    );
    return 1;
  }
  console.error(
    pattern2 === null ? `Read as a saved JSON contract. The pattern file is the form this is moving to.` : `Read as a pattern file: ${pattern2.name}.`
  );
  const byFile = /* @__PURE__ */ new Map();
  let measured = 0;
  let unread = 0;
  const handedOver = /* @__PURE__ */ new Set();
  const otherKind = [];
  for (const file of files) {
    const absolute = resolve9(rootDir, file);
    const where2 = relative12(rootDir, absolute);
    const pair = await pairOf(absolute);
    const identity = pair?.identity ?? absolute;
    const source = await readFile30(identity, "utf8").catch(() => null);
    if (source === null) {
      unread++;
      continue;
    }
    const markup = pair === null ? { path: absolute, source } : await markupOf(identity, source);
    const holder = regionsOf(markup.source, templateKind(markup.path) ?? void 0)?.holder ?? null;
    if (pattern2 === null) {
      if (contractsForScreen([parsed], holder).length === 0) {
        otherKind.push(where2);
        continue;
      }
      const deviations = contractDeviations(where2, markup.source, parsed);
      if (deviations === null) continue;
      measured++;
      if (deviations.length > 0) byFile.set(deviations[0].file, deviations);
      continue;
    }
    if (patternForScreen([pattern2], where2, holder) === null) {
      otherKind.push(where2);
      continue;
    }
    const deep = Math.max(...pattern2.structure.map((line) => line.indent), 0) + 1;
    const tree2 = await screenTree(rootDir, identity, { depth: deep }).catch(() => null);
    const report = patternDeviations(where2, markup.source, pattern2, tree2);
    measured++;
    for (const one of report.handedOver) handedOver.add(one);
    if (report.deviations.length > 0) byFile.set(where2, report.deviations);
  }
  const SHOWN = 20;
  for (const [file, deviations] of [...byFile].slice(0, SHOWN)) {
    console.log(file);
    for (const deviation of deviations) console.log(`  ${deviation.message}`);
  }
  if (byFile.size > SHOWN) console.log(`\u2026 and ${byFile.size - SHOWN} more screen(s)`);
  if (unread > 0) console.error(`${unread} path(s) could not be read.`);
  if (otherKind.length > 0) {
    console.error(
      `${otherKind.length} path(s) are of another kind and were not compared: ${otherKind.slice(0, 5).join(", ")}${otherKind.length > 5 ? ", \u2026" : ""}`
    );
  }
  if (handedOver.size > 0) {
    console.log("\nStated by the pattern and evaluated by nothing here \u2014 read them:");
    for (const one of handedOver) console.log(`  - ${one}`);
  }
  if (measured === 0) {
    console.error(`None of the ${files.length} path(s) given is a screen, so nothing was compared.`);
    return 1;
  }
  if (byFile.size === 0) console.log(`${measured} screen(s) match everything checked here.`);
  return byFile.size > 0 || unread > 0 ? 1 : 0;
}
async function tree(rootDir, args) {
  const file = pathsIn2(args)[0];
  if (file === void 0) {
    console.error(`Usage: uic tree <screen> [--depth N]   (1-${MAX_DEPTH}, default ${DEFAULT_DEPTH})`);
    return 1;
  }
  const depth = depthIn(args);
  const absolute = resolve9(rootDir, file);
  const root = await findProjectRoot(dirname15(absolute)) ?? rootDir;
  const walked = await screenTree(root, absolute, depth === void 0 ? {} : { depth });
  if (walked === null) {
    console.error(`Nothing to read in ${relative12(rootDir, absolute)}.`);
    console.error("Either it renders no component, or it is not a screen file.");
    return 0;
  }
  console.log(
    `${relative12(root, absolute)} \u2014 ${walked.depth} ${walked.depth === 1 ? "level" : "levels"}, ${walked.read.length} ${walked.read.length === 1 ? "file" : "files"} read${walked.truncated ? ", stopped by the depth" : ""}`
  );
  for (const line of branch(walked.root, 0, null)) console.log(line);
  return 0;
}
function branch(node, indent, from) {
  const moved = node.file !== null && node.file !== from;
  const where2 = node.at === "project" ? moved ? `  ${node.file}` : "" : `  (${node.at})`;
  const stopped = node.holderAt === void 0 ? "" : `  (holder in a ${node.holderAt})`;
  const through = node.via === void 0 ? "" : `  \u2190 ${node.via}`;
  return [
    `${"  ".repeat(indent)}${node.name}${where2}${stopped}${through}`,
    ...node.children.flatMap((child) => branch(child, indent + 1, node.file))
  ];
}
async function props(rootDir, args) {
  const [component, ...rest] = args.filter((arg) => !arg.startsWith("-"));
  if (component === void 0 || rest.length === 0) {
    console.error("Usage: uic props <Component> <file...>");
    return 1;
  }
  const { absolute, problems } = await givenFiles(rootDir, rest);
  for (const problem of problems) console.error(problem);
  if (absolute.length === 0) {
    console.error(`No file to read, so nothing is known about <${component}>.`);
    return 1;
  }
  const matrix = await propsMatrix(rootDir, component, absolute);
  const total = matrix.renders.length;
  console.log(
    `${component} \u2014 rendered by ${total} of ${absolute.length} ${absolute.length === 1 ? "file" : "files"} read`
  );
  if (total === 0) return 0;
  const all = matrix.rows.filter((row) => row.written.length === total);
  const some = matrix.rows.filter((row) => row.written.length < total);
  if (all.length > 0) {
    console.log(`
written by all ${total}`);
    for (const row of all) console.log(`  ${row.name}${row.value === null ? "" : ` = ${JSON.stringify(row.value)}`}`);
  }
  if (some.length > 0) {
    console.log("\nwritten by some");
    for (const row of some) {
      const missing = matrix.renders.filter((file) => !row.written.includes(file));
      console.log(
        `  ${row.name}${row.value === null ? "" : ` = ${JSON.stringify(row.value)}`}  \u2014  ${row.written.length} of ${total}, not in ${missing.join(", ")}`
      );
    }
  }
  if (matrix.absent.length > 0) {
    console.log(`
does not render it
  ${matrix.absent.join("\n  ")}`);
  }
  if (matrix.unreadable.length > 0) {
    console.log(`
could not be read
  ${matrix.unreadable.join("\n  ")}`);
  }
  return 0;
}
async function group(rootDir, args) {
  const files = pathsIn2(args);
  if (files.length === 0) {
    console.error(`Usage: uic group <file...> [--depth N]   (1-${MAX_DEPTH}, default ${DEFAULT_DEPTH})`);
    return 1;
  }
  const { absolute, problems } = await givenFiles(rootDir, files);
  for (const problem of problems) console.error(problem);
  if (absolute.length === 0) {
    console.error("No file to read, so there is nothing to group.");
    return 1;
  }
  const grouped = await groupScreens(rootDir, absolute, depthIn(args));
  const screens = grouped.groups.reduce((count, one) => count + one.members.length, 0) + grouped.ungrouped.length;
  const skipped = grouped.notScreens.length;
  console.log(
    `${grouped.given} ${grouped.given === 1 ? "file" : "files"}, ${screens} ${screens === 1 ? "screen" : "screens"}${skipped === 0 ? "" : `, ${skipped} not a screen`}, read ${grouped.depth} ${grouped.depth === 1 ? "level" : "levels"} \u2014 ${grouped.groups.length} ${grouped.groups.length === 1 ? "group" : "groups"}`
  );
  for (const one of grouped.groups) {
    console.log(`
${one.members.length} ${one.members.length === 1 ? "screen" : "screens"}`);
    for (const line of one.signature) console.log(`  ${line}`);
    console.log(`  e.g. ${one.members[0]}`);
  }
  if (grouped.ungrouped.length > 0) {
    const n = grouped.ungrouped.length;
    console.log(
      `
${n} ${n === 1 ? "screen shares" : "screens share"} nothing with any of these
  ` + grouped.ungrouped.join("\n  ")
    );
  }
  if (grouped.notScreens.length > 0) {
    console.log(
      `
not screens \u2014 nothing rendered in them, a name saying what they are, or a part another of these files imports
  ${grouped.notScreens.join("\n  ")}`
    );
  }
  return 0;
}
function pathsIn2(args) {
  const at = args.findIndex((arg) => arg === "--depth");
  const value = at === -1 ? -1 : at + 1;
  return args.filter((arg, index) => !arg.startsWith("-") && index !== value);
}
function depthIn(args) {
  const at = args.findIndex((arg) => arg === "--depth" || arg.startsWith("--depth="));
  if (at === -1) return void 0;
  const depth = Number.parseInt(args[at]?.split("=")[1] ?? args[at + 1] ?? "", 10);
  return Number.isNaN(depth) ? void 0 : depth;
}
async function patterns(rootDir, args) {
  const { patterns: found, legacy } = await patternFiles(rootDir);
  if (legacy) console.error(MOVED);
  const target = pathsIn2(args)[0];
  if (target !== void 0) return coveringOne(rootDir, found, target);
  if (found.length === 0) {
    console.log(`No pattern files in ${KNOWLEDGE_DIR}/patterns.`);
    console.log("That is a project that has written nothing down, not a project with no patterns.");
    return 0;
  }
  console.log(`${found.length} ${found.length === 1 ? "pattern" : "patterns"} in ${KNOWLEDGE_DIR}/patterns
`);
  for (const one of found) {
    const members = one.members.length;
    console.log(
      `${one.name}  ${one.surface ?? "\u2014"}  ${one.holder ?? "\u2014"}  ${members} ${members === 1 ? "file" : "files"}${one.observed === null ? "" : `  observed ${one.observed}`}`
    );
    for (const line of staleness(await staleIn(rootDir, one), one.derived)) console.log(`  ${line}`);
  }
  return 0;
}
async function coveringOne(rootDir, found, target) {
  const absolute = resolve9(rootDir, target);
  const where2 = relative12(rootDir, absolute);
  const holder = await holderOf2(absolute);
  const covering = patternForScreen(found, where2, holder);
  if (covering === null) {
    console.log(`${where2} \u2014 no pattern covers it.`);
    console.log(
      holder === null ? "  Nothing readable holds it, so there is nothing to match a pattern on." : `  It sits in <${holder}>, and no pattern file names that holder or names this file.`
    );
    return 0;
  }
  console.log(`${where2} \u2014 ${covering.name} (${KNOWLEDGE_DIR}/patterns/${covering.file})`);
  console.log(
    covering.members.includes(where2) ? "  named by the pattern itself" : `  sits in <${holder}>, which is the pattern's holder`
  );
  for (const line of staleness(await staleIn(rootDir, covering), covering.derived)) console.log(`  ${line}`);
  return 0;
}
function staleness(stale, derived = false) {
  const say = (why, text) => {
    const files = stale.filter((one) => one.why === why).map((one) => one.file);
    return files.length === 0 ? [] : [`${text}: ${files.join(", ")}`];
  };
  const said = [...say("changed", "changed since it was read"), ...say("gone", "no longer there")];
  if (said.length > 0 && derived) said.push("`uic pattern <one of them> --refresh` re-counts it");
  return said;
}
async function place2(rootDir, args) {
  const file = args.find((arg) => !arg.startsWith("-"));
  if (file === void 0) {
    console.error("Usage: uic place <screen>");
    return 1;
  }
  const absolute = resolve9(rootDir, file);
  const root = await findProjectRoot(dirname15(absolute)) ?? rootDir;
  const placed = await placementOf(absolute, root);
  if (placed.style === null) {
    console.error(`Nothing routes ${relative12(rootDir, absolute)}.`);
    console.error("Either it is not a screen, or its route is registered somewhere this cannot");
    console.error("read. Say where, rather than letting a path be guessed from the folder.");
    return 0;
  }
  console.log(
    JSON.stringify(
      {
        ...placed,
        ...placed.declaredIn === null ? {} : {
          declaredIn: {
            ...placed.declaredIn,
            file: relative12(rootDir, placed.declaredIn.file)
          }
        }
      },
      null,
      2
    )
  );
  return 0;
}
async function scan(rootDir) {
  const sources2 = await detectionSources(rootDir);
  const detected = await cachedPackages(rootDir);
  if (detected.length === 0) {
    console.error("No packages detected.");
    console.error("\nLooked for:");
    console.error("  pnpm-workspace.yaml, or package.json workspaces \u2014 the package set");
    console.error("  each package.json dependencies \u2014 the order between them");
    console.error("  compilerOptions.paths in tsconfig.base.json or tsconfig.json \u2014 packages");
    console.error("  that have no manifest at all, as an Nx workspace does");
    console.error("\nNone of them matched here. That is a gap in detection rather than");
    console.error("something for you to configure \u2014 please report what this repository");
    console.error("looks like: https://github.com/kamenkurtev/ui-consistency/issues");
    return 1;
  }
  console.log(`Detected packages, via ${sources2.length > 0 ? sources2.join(" and ") : "the root package.json"}:`);
  for (const pkg of detected) {
    console.log(`  ${pkg.name} \u2192 ${pkg.dependencies.join(", ") || "(no dependencies)"}`);
  }
  console.log("");
  await clearPackageCache(rootDir);
  const packages = applyConfig(await cachedPackages(rootDir), await readConfig(rootDir));
  const layers = packages.map((pkg) => ({
    name: pkg.name,
    root: pkg.root,
    dependencies: pkg.dependencies
  }));
  const inventory2 = await buildInventory(layers);
  for (const [name, symbols] of Object.entries(inventory2.layers)) {
    const total = Object.keys(symbols).length;
    const deprecated = Object.values(symbols).filter((s) => s.deprecated).length;
    console.log(`${name}: ${total} exports${deprecated > 0 ? `, ${deprecated} deprecated` : ""}`);
  }
  return 0;
}
async function warnIfNothingWasChecked(rootDir, files) {
  if (files.length === 0) return;
  const config = await readConfig(rootDir);
  const packages = applyConfig(await cachedPackages(rootDir), config);
  const prefer = config?.prefer ?? [];
  const onAChain = files.filter((file) => resolveChain(file, packages, prefer).length > 0);
  if (onAChain.length > 0) return;
  console.error(`
None of the ${files.length} file(s) given belongs to a detected package.`);
  console.error("The checks that read one \u2014 imports, deprecated usage \u2014 did not run.");
  console.error("This is a detection gap, not a clean result.");
  if (packages.length === 0) {
    console.error("No packages were detected at all \u2014 run `uic scan` to see what was looked for.");
  } else {
    console.error("Detected packages, and where they are rooted:");
    for (const pkg of packages.slice(0, 10)) {
      console.error(`  ${pkg.name} \u2192 ${relative12(rootDir, pkg.root) || "."}`);
    }
    console.error("If none of those is where your application lives, that is the bug \u2014");
    console.error("please report it: https://github.com/kamenkurtev/ui-consistency/issues");
  }
}
var GLOB = /[*?[\]{}]/;
async function givenFiles(rootDir, files) {
  const absolute = [];
  const problems = [];
  for (const file of files) {
    const path = resolve9(rootDir, file);
    const found = await stat12(path).catch(() => null);
    if (found === null) {
      problems.push(
        GLOB.test(file) ? `${file} matched no file. Globs are expanded by your shell, so a quoted pattern arrives here literally.` : `${file} does not exist.`
      );
      continue;
    }
    if (found.isDirectory()) {
      problems.push(`${file} is a directory, and this takes files.`);
      continue;
    }
    absolute.push(path);
  }
  return { absolute, problems };
}
function sayHowToNameFiles(problems) {
  for (const problem of problems) console.error(problem);
  console.error("Name the files, or let the shell name them: $(git ls-files '*.tsx')");
}
async function check(rootDir, args) {
  const flags = args.filter((arg) => arg.startsWith("-"));
  const unknown = flags.filter((flag) => flag !== "--within-layer" && flag !== "--list");
  if (unknown.length > 0) {
    console.error(`Unknown option: ${unknown.join(", ")}`);
    console.error("Usage: uic check [--within-layer] [--list] <file...>");
    return 1;
  }
  const withinLayer = flags.includes("--within-layer");
  const listOnly = flags.includes("--list");
  const files = args.filter((arg) => !arg.startsWith("-"));
  if (files.length === 0) {
    console.error("Usage: uic check [--within-layer] <file...>");
    return 1;
  }
  const { absolute, problems } = await givenFiles(rootDir, files);
  if (problems.length > 0) {
    sayHowToNameFiles(problems);
    return 1;
  }
  const findings = await analyzeProject(rootDir, absolute, { withinLayer });
  if (!listOnly) await warnIfNothingWasChecked(rootDir, absolute);
  let coverage = null;
  if (findings.length === 0) {
    coverage = await coverageOf(rootDir, absolute).catch(() => null);
    if (coverage !== null && !listOnly) {
      for (const line of sayCoverage(coverage)) console.error(line);
    }
  }
  if (coverage !== null && coverage.given > 0 && coverage.read === 0) {
    if (listOnly) console.error(`None of the ${coverage.given} file(s) given could be read.`);
    return 1;
  }
  if (listOnly) {
    const seen = /* @__PURE__ */ new Set();
    for (const finding of findings) {
      const path = relative12(rootDir, finding.file);
      if (seen.has(path)) continue;
      seen.add(path);
      console.log(path);
    }
    if (seen.size === 0 && coverage !== null) {
      for (const line of sayCoverage(coverage)) console.error(line);
    }
    return seen.size > 0 ? 1 : 0;
  }
  for (const finding of findings) {
    console.log(`${formatFinding({ ...finding, file: relative12(rootDir, finding.file) })}
`);
  }
  return findings.length > 0 ? 1 : 0;
}
async function inventory(rootDir, args) {
  const file = args.find((arg) => !arg.startsWith("-"));
  if (file === void 0) {
    console.error("Usage: uic inventory <file>");
    return 1;
  }
  const config = await readConfig(rootDir);
  const packages = applyConfig(await cachedPackages(rootDir), config);
  const chain = resolveChain(resolve9(rootDir, file), packages, config?.prefer ?? []);
  const named2 = relative12(rootDir, resolve9(rootDir, file));
  if (chain.length === 0) {
    console.error(`${named2} belongs to no detected package.`);
    console.error(
      packages.length === 0 ? "No package was detected at all \u2014 `uic scan` shows what was looked for." : `${packages.length} package(s) were detected, and none of them owns this file.`
    );
    console.error("There is no inventory to print, which is a detection gap and not a clean result.");
    return 1;
  }
  const built = await cachedInventory(rootDir, chain);
  let printed = 0;
  for (const layer of chain) {
    const symbols = built.layers[layer.name] ?? {};
    const names = Object.keys(symbols).sort();
    if (names.length === 0) continue;
    printed++;
    console.log(`# ${layer.name}`);
    for (const name of names) {
      const entry = symbols[name];
      const note = entry.deprecated ? ` \u2014 deprecated${entry.replacement === null ? "" : `, use ${entry.replacement}`}` : "";
      console.log(`  ${name}${note}`);
    }
  }
  if (printed === 0) {
    console.error(`Nothing readable on the ${chain.length} layer(s) ${named2} sits on:`);
    for (const layer of chain.slice(0, 10)) console.error(`  ${layer.name}`);
    console.error("Every one of them is external, or its entry point could not be read.");
    return 1;
  }
  return 0;
}
async function hook() {
  const response = await hookResponse(await readStdin()).catch(() => null);
  if (response !== null) console.log(JSON.stringify(response));
  return 0;
}
async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}
async function session() {
  const response = await sessionResponse(await readStdin()).catch(() => null);
  if (response !== null) console.log(JSON.stringify(response));
  return 0;
}
async function prompt() {
  const said = await promptResponse(await readStdin()).catch(() => null);
  if (said !== null) console.log(said);
  return 0;
}
async function auditShapes(rootDir, args) {
  const given = args.filter((arg) => !arg.startsWith("-"));
  if (given.length === 0) {
    console.error("Usage: uic shapes <file...>");
    return 1;
  }
  const { absolute: named2, problems } = await givenFiles(rootDir, given);
  if (problems.length > 0) {
    sayHowToNameFiles(problems);
    return 1;
  }
  const files = named2;
  const config = await readConfig(rootDir);
  const packages = applyConfig(await cachedPackages(rootDir), config);
  const dependedOn = new Set(packages.flatMap((pkg) => pkg.dependencies));
  const library = [];
  const app = [];
  for (const file of files) {
    const absolute = resolve9(rootDir, file);
    const source = await readFile30(absolute, "utf8").catch(() => null);
    if (source === null) continue;
    const owner = packages.find((pkg) => contains(pkg.root, absolute));
    const shared2 = owner !== void 0 && dependedOn.has(owner.name);
    if (shared2) {
      const exported = [...exportedSymbolsFromSource(source)];
      if (exported.length === 1) {
        library.push({ component: exported[0], file: relative12(rootDir, absolute), source });
      }
    }
    app.push({ file: relative12(rootDir, absolute), source });
  }
  const report = shapeReport({ library, app });
  const byComponent = /* @__PURE__ */ new Map();
  for (const entry of report.handRolled) {
    const group2 = byComponent.get(entry.component) ?? { definedIn: entry.definedIn, places: [] };
    group2.places.push(`${entry.file}:${entry.line}`);
    byComponent.set(entry.component, group2);
  }
  for (const [component, group2] of [...byComponent].sort(
    (a, b) => b[1].places.length - a[1].places.length
  )) {
    console.log(
      `shape of ${component} (${group2.definedIn})
  appears in ${group2.places.length} other place(s):`
    );
    for (const place3 of group2.places.slice(0, 5)) console.log(`    ${place3}`);
    if (group2.places.length > 5) console.log(`    \u2026 and ${group2.places.length - 5} more`);
  }
  for (const entry of report.repeated) {
    const backing = entry.existsAs === null ? "nothing exports this shape \u2014 a candidate for extraction" : `${entry.existsAs.component} already has this shape (${entry.existsAs.definedIn})`;
    console.log(`${entry.files.length} files share a ${entry.size}-element shape \u2014 ${backing}:`);
    for (const file of entry.files.slice(0, 5)) console.log(`    ${file}`);
    if (entry.files.length > 5) console.log(`    \u2026 and ${entry.files.length - 5} more`);
  }
  if (report.handRolled.length === 0 && report.repeated.length === 0) {
    console.log("No repeated shapes worth extracting, and nothing rebuilt.");
  } else {
    console.log("\nSuspects, not findings. A shape that repeats may be a shared pattern");
    console.log("worth extracting, a component somebody rebuilt by hand, or the same");
    console.log("mistake copied. From the AST those look identical \u2014 read them before");
    console.log("acting on any of them. This is why it is a separate command and never");
    console.log("part of the per-file check.");
  }
  return 0;
}
async function showLog(rootDir) {
  const entries = await readLog(rootDir);
  if (entries.length === 0) {
    console.log("Nothing logged yet for this project.");
    console.log(`It is written to ${logPath(rootDir)} as you work, unless UIC_LOG=off.`);
    return 0;
  }
  console.log(`Project: ${rootDir}`);
  const summary = summarise(entries, await readSeen(rootDir));
  const days = summary.from === null || summary.to === null ? "" : ` over ${Math.max(1, Math.round((summary.to - summary.from) / 864e5))} day(s)`;
  console.log(`${summary.total} finding(s), ${summary.advice} advisory${days}
`);
  if (summary.advice > 0) {
    const advisories = entries.filter((entry) => entry.kind === "advice");
    console.log("Advice handed to the agent \u2014 a judgement, so worth checking by hand:");
    for (const entry of advisories.slice(-5)) {
      console.log(`  ${entry.file}`);
      console.log(`    ${entry.message}`);
    }
    if (advisories.length > 5) console.log(`  \u2026 and ${advisories.length - 5} more`);
    console.log("");
  }
  if (summary.total === 0) {
    console.log(`Full log: ${logPath(rootDir)}`);
    return 0;
  }
  console.log("By kind:");
  for (const [level, count] of Object.entries(summary.byLevel).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(count).padStart(5)}  ${level}`);
  }
  console.log("\nFiles that produce the most:");
  for (const entry of summary.byFile.slice(0, 10)) {
    console.log(`  ${String(entry.count).padStart(5)}  ${entry.file}`);
  }
  if (summary.spread.length > 0) {
    console.log("\nSaid about many different files:");
    for (const entry of summary.spread.slice(0, 10)) {
      console.log(`  ${String(entry.files).padStart(5)} files  ${entry.message}`);
    }
    console.log("\nEither the project has an opinion here it has not written down \u2014");
    console.log(`one heading in ${KNOWLEDGE_DIR}/ is enough \u2014 or it has written`);
    console.log("one and nothing is following it. Both are worth reading; neither is");
    console.log("a failure.");
  }
  if (summary.repeated.length > 0) {
    console.log("\nSaid more than once \u2014 told, and not acted on:");
    for (const entry of summary.repeated.slice(0, 10)) {
      console.log(`  ${String(entry.times).padStart(5)}x ${entry.file}:${entry.line}`);
      console.log(`         ${entry.message}`);
    }
    console.log("\nThese are the ones worth reading: either the finding is wrong,");
    console.log("or it is right and nothing is acting on it. Both are worth knowing.");
  }
  if (summary.acted + summary.unknown > 0) {
    console.log("\nFindings that did not come back:");
    console.log(`  ${String(summary.acted).padStart(5)}  acted on \u2014 the file was checked again and this was gone`);
    console.log(`  ${String(summary.unknown).padStart(5)}  not known \u2014 the file was never checked again`);
    console.log("\nOnly the first is evidence. A file edited once has had no chance to");
    console.log("show whether it was told and did nothing.");
  }
  console.log(`
Full log: ${logPath(rootDir)}`);
  return 0;
}
async function main(argv) {
  const [command, ...rest] = argv;
  const rootDir = process.cwd();
  switch (command) {
    case "pattern":
      return pattern(rootDir, rest);
    case "diff":
      return diff(rootDir, rest);
    case "place":
      return place2(rootDir, rest);
    case "tree":
      return tree(rootDir, rest);
    case "props":
      return props(rootDir, rest);
    case "group":
      return group(rootDir, rest);
    case "patterns":
      return patterns(rootDir, rest);
    case "scan":
      return scan(rootDir);
    case "check":
      return check(rootDir, rest);
    case "review":
      return review(rootDir, rest);
    case "shapes":
      return auditShapes(rootDir, rest);
    case "inventory":
      return inventory(rootDir, rest);
    case "log":
      return showLog(rootDir);
    case "hook":
      return hook();
    case "session":
      return session();
    case "prompt":
      return prompt();
    default:
      console.error("Usage: uic <pattern|patterns|diff|place|tree|props|group|scan|check|review|shapes|inventory|log>");
      return 1;
  }
}
if (process.argv[1] !== void 0) {
  const entry = await realpath3(process.argv[1]).then((real) => pathToFileURL(real).href).catch(() => null);
  if (entry === import.meta.url) process.exit(await main(process.argv.slice(2)));
}
export {
  adviseProject,
  analyzeProject,
  checkProject,
  main
};
/*! Bundled license information:

angular-html-parser/dist/compiler/src/ml_parser/tags.mjs:
  (**
  * @license
  * Copyright Google LLC All Rights Reserved.
  *
  * Use of this source code is governed by an MIT-style license that can be
  * found in the LICENSE file at https://angular.dev/license
  *)

angular-html-parser/dist/compiler/src/schema/dom_security_schema.mjs:
  (**
  * @license
  * Copyright Google LLC All Rights Reserved.
  *
  * Use of this source code is governed by an MIT-style license that can be
  * found in the LICENSE file at https://angular.dev/license
  *)

angular-html-parser/dist/compiler/src/core.mjs:
  (**
  * @license
  * Copyright Google LLC All Rights Reserved.
  *
  * Use of this source code is governed by an MIT-style license that can be
  * found in the LICENSE file at https://angular.dev/license
  *)

angular-html-parser/dist/compiler/src/util.mjs:
  (**
  * @license
  * Copyright Google LLC All Rights Reserved.
  *
  * Use of this source code is governed by an MIT-style license that can be
  * found in the LICENSE file at https://angular.dev/license
  *)

angular-html-parser/dist/compiler/src/schema/element_schema_registry.mjs:
  (**
  * @license
  * Copyright Google LLC All Rights Reserved.
  *
  * Use of this source code is governed by an MIT-style license that can be
  * found in the LICENSE file at https://angular.dev/license
  *)

angular-html-parser/dist/compiler/src/schema/dom_element_schema_registry.mjs:
  (**
  * @license
  * Copyright Google LLC All Rights Reserved.
  *
  * Use of this source code is governed by an MIT-style license that can be
  * found in the LICENSE file at https://angular.dev/license
  *)

angular-html-parser/dist/compiler/src/ml_parser/html_tags.mjs:
  (**
  * @license
  * Copyright Google LLC All Rights Reserved.
  *
  * Use of this source code is governed by an MIT-style license that can be
  * found in the LICENSE file at https://angular.dev/license
  *)

angular-html-parser/dist/compiler/src/parse_util.mjs:
  (**
  * @license
  * Copyright Google LLC All Rights Reserved.
  *
  * Use of this source code is governed by an MIT-style license that can be
  * found in the LICENSE file at https://angular.dev/license
  *)

angular-html-parser/dist/compiler/src/ml_parser/ast.mjs:
  (**
  * @license
  * Copyright Google LLC All Rights Reserved.
  *
  * Use of this source code is governed by an MIT-style license that can be
  * found in the LICENSE file at https://angular.dev/license
  *)

angular-html-parser/dist/compiler/src/chars.mjs:
  (**
  * @license
  * Copyright Google LLC All Rights Reserved.
  *
  * Use of this source code is governed by an MIT-style license that can be
  * found in the LICENSE file at https://angular.dev/license
  *)

angular-html-parser/dist/compiler/src/ml_parser/entities.mjs:
  (**
  * @license
  * Copyright Google LLC All Rights Reserved.
  *
  * Use of this source code is governed by an MIT-style license that can be
  * found in the LICENSE file at https://angular.dev/license
  *)

angular-html-parser/dist/compiler/src/ml_parser/lexer.mjs:
  (**
  * @license
  * Copyright Google LLC All Rights Reserved.
  *
  * Use of this source code is governed by an MIT-style license that can be
  * found in the LICENSE file at https://angular.dev/license
  *)

angular-html-parser/dist/compiler/src/ml_parser/parser.mjs:
  (**
  * @license
  * Copyright Google LLC All Rights Reserved.
  *
  * Use of this source code is governed by an MIT-style license that can be
  * found in the LICENSE file at https://angular.dev/license
  *)

angular-html-parser/dist/compiler/src/ml_parser/html_parser.mjs:
  (**
  * @license
  * Copyright Google LLC All Rights Reserved.
  *
  * Use of this source code is governed by an MIT-style license that can be
  * found in the LICENSE file at https://angular.dev/license
  *)
*/
