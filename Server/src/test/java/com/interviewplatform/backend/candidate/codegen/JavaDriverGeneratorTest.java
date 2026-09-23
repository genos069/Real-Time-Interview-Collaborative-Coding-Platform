package com.interviewplatform.backend.candidate.codegen;

import com.interviewplatform.backend.model.ExecutionMetadata;
import com.interviewplatform.backend.model.TestCase;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class JavaDriverGeneratorTest {

    private JavaDriverGenerator generator;

    @BeforeEach
    void setUp() {
        generator = new JavaDriverGenerator();
    }

    @Test
    void testGenerate_SimpleScalarReturn() {
        String userCode = """
                class Solution {
                    public int add(int a, int b) {
                        return a + b;
                    }
                }
                """;

        ExecutionMetadata metadata = new ExecutionMetadata();
        metadata.setMethodName("add");
        metadata.setReturnType("int");
        metadata.setParameterTypes(List.of("int", "int"));

        TestCase testCase = new TestCase();
        testCase.setArguments(List.of("2", "3"));
        testCase.setExpectedOutput("5");

        String generated = generator.generate(userCode, metadata, List.of(testCase));

        assertTrue(generated.contains("import java.util.*;"));
        assertTrue(generated.contains("public class Main"));
        assertTrue(generated.contains("formatResult"));
        assertTrue(generated.contains("Main solution = new Main();"));
        assertTrue(generated.contains("solution.add(2, 3)"));
    }

    @Test
    void testGenerate_TwoSumArrayReturn() {
        String userCode = """
                class Solution {
                    public int[] twoSum(int[] nums, int target) {
                        return new int[]{0, 1};
                    }
                }
                """;

        ExecutionMetadata metadata = new ExecutionMetadata();
        metadata.setMethodName("twoSum");
        metadata.setReturnType("int[]");
        metadata.setParameterTypes(List.of("int[]", "int"));

        TestCase testCase = new TestCase();
        testCase.setArguments(List.of("[2,7,11,15]", "9"));
        testCase.setExpectedOutput("[0,1]");

        String generated = generator.generate(userCode, metadata, List.of(testCase));

        assertTrue(generated.contains("public class Main"));
        assertTrue(generated.contains("new int[]{2,7,11,15}"));
        assertTrue(generated.contains("solution.twoSum(new int[]{2,7,11,15}, 9)"));
    }

    @Test
    void testGenerate_NQueensNestedGenericReturn_WithNullMetadataFallback() {
        String userCode = """
                class Solution {
                    public List<List<String>> solveNQueens(int n) {
                        List<List<String>> result = new ArrayList<>();
                        return result;
                    }
                }
                """;

        TestCase testCase = new TestCase();
        testCase.setArguments(List.of("4"));
        testCase.setExpectedOutput("[[\".Q..\",\"...Q\",\"Q...\",\"..Q.\"],[\"..Q.\",\"Q...\",\"...Q\",\".Q..\"]]");

        // Pass null metadata to verify resilient fallback to JavaSignatureParser
        String generated = generator.generate(userCode, null, List.of(testCase));

        assertTrue(generated.contains("public class Main"));
        assertTrue(generated.contains("formatResult(Object obj)"));
        assertTrue(generated.contains("public static void main(String[] args)"));
        assertTrue(generated.contains("solution.solveNQueens(4)"));
    }

    @Test
    void testGenerate_VoidMethod_PrintsModifiedArgument() {
        String userCode = """
                class Solution {
                    public void moveZeroes(int[] nums) {
                        int insertPos = 0;
                        for (int num : nums) {
                            if (num != 0) nums[insertPos++] = num;
                        }
                        while (insertPos < nums.size()) nums[insertPos++] = 0;
                    }
                }
                """;

        ExecutionMetadata metadata = new ExecutionMetadata();
        metadata.setMethodName("moveZeroes");
        metadata.setReturnType("void");
        metadata.setParameterTypes(List.of("int[]"));

        TestCase testCase = new TestCase();
        testCase.setArguments(List.of("[0,1,0,3,12]"));
        testCase.setExpectedOutput("[1,3,12,0,0]");

        String generated = generator.generate(userCode, metadata, List.of(testCase));

        assertTrue(generated.contains("int[] arg0 = new int[]{0,1,0,3,12};"));
        assertTrue(generated.contains("solution.moveZeroes(arg0);"));
        assertTrue(generated.contains("System.out.println(formatResult(arg0));"));
    }

    @Test
    void testGenerate_GenericListReturnAndInput() {
        String userCode = """
                class Solution {
                    public List<String> findWords(List<String> words) {
                        return words;
                    }
                }
                """;

        ExecutionMetadata metadata = new ExecutionMetadata();
        metadata.setMethodName("findWords");
        metadata.setReturnType("List<String>");
        metadata.setParameterTypes(List.of("List<String>"));

        TestCase testCase = new TestCase();
        testCase.setArguments(List.of("[\"flower\",\"flow\",\"flight\"]"));
        testCase.setExpectedOutput("[\"flower\",\"flow\",\"flight\"]");

        String generated = generator.generate(userCode, metadata, List.of(testCase));

        assertTrue(generated.contains("new ArrayList<>(Arrays.asList(\"flower\", \"flow\", \"flight\"))"));
        assertTrue(generated.contains("solution.findWords("));
    }

    @Test
    void testConvertArgument_VariousTypes() {
        // Primitives
        assertEquals("42", generator.convertArgument("int", "42"));
        assertEquals("true", generator.convertArgument("boolean", "True"));
        assertEquals("'c'", generator.convertArgument("char", "c"));
        assertEquals("\"hello\"", generator.convertArgument("String", "hello"));

        // Arrays
        assertEquals("new int[]{1, 2, 3}", generator.convertArgument("int[]", "[1, 2, 3]"));
        assertEquals("new String[]{\"a\", \"b\"}", generator.convertArgument("String[]", "[\"a\",\"b\"]"));
        assertEquals("new int[][]{{1,2},{3,4}}", generator.convertArgument("int[][]", "[[1,2],[3,4]]"));

        // Generic Lists
        assertEquals("new ArrayList<>(Arrays.asList(1, 2, 3))", generator.convertArgument("List<Integer>", "[1, 2, 3]"));
        assertEquals("new ArrayList<>(Arrays.asList(\"a\", \"b\"))", generator.convertArgument("List<String>", "[\"a\",\"b\"]"));

        // Nested generic list
        String nestedList = generator.convertArgument("List<List<String>>", "[[\"a\",\"b\"],[\"c\",\"d\"]]");
        assertTrue(nestedList.contains("new ArrayList<>(Arrays.asList("));
        assertTrue(nestedList.contains("Arrays.asList(\"a\", \"b\")"));
        assertTrue(nestedList.contains("Arrays.asList(\"c\", \"d\")"));
    }

    @Test
    void testGenerate_MultipleTestCases_FreshInstancePerCase() {
        String userCode = """
                class Solution {
                    private List<List<String>> result = new ArrayList<>();
                    public List<List<String>> solveNQueens(int n) {
                        return result;
                    }
                }
                """;

        TestCase tc1 = new TestCase();
        tc1.setArguments(List.of("4"));
        tc1.setExpectedOutput("[[\".Q..\",\"...Q\",\"Q...\",\"..Q.\"],[\"..Q.\",\"Q...\",\"...Q\",\".Q..\"]]");

        TestCase tc2 = new TestCase();
        tc2.setArguments(List.of("1"));
        tc2.setExpectedOutput("[[\"Q\"]]");

        String generated = generator.generate(userCode, null, List.of(tc1, tc2));

        // Verify resetStaticState helper is generated
        assertTrue(generated.contains("resetStaticState()"));

        // Verify each test case has its own block with fresh instance and static reset
        int firstReset = generated.indexOf("resetStaticState();");
        int secondReset = generated.indexOf("resetStaticState();", firstReset + 1);
        assertTrue(firstReset != -1, "First test case must call resetStaticState()");
        assertTrue(secondReset != -1, "Second test case must call resetStaticState()");

        int firstSolution = generated.indexOf("Main solution = new Main();");
        int secondSolution = generated.indexOf("Main solution = new Main();", firstSolution + 1);
        assertTrue(firstSolution != -1, "First test case must create fresh Main solution");
        assertTrue(secondSolution != -1, "Second test case must create fresh Main solution");

        // Verify main does NOT have a shared solution outside the testcase blocks
        int mainStart = generated.indexOf("public static void main(String[] args) {");
        int firstBlock = generated.indexOf("{", mainStart + 40);
        assertTrue(firstSolution > firstBlock, "solution must be instantiated inside the testcase block");
    }

    @Test
    void testGenerate_AddTwoNumbers_LinkedList() {
        String userCode = """
                /**
                 * Definition for singly-linked list.
                 * public class ListNode {
                 *     int val;
                 *     ListNode next;
                 *     ListNode() {}
                 *     ListNode(int val) { this.val = val; }
                 *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }
                 * }
                 */
                class Solution {
                    public ListNode addTwoNumbers(ListNode l1, ListNode l2) {
                        ListNode dummy = new ListNode(0);
                        ListNode current = dummy;
                        int carry = 0;

                        while (l1 != null || l2 != null || carry != 0) {
                            int sum = carry;

                            if (l1 != null) {
                                sum += l1.val;
                                l1 = l1.next;
                            }

                            if (l2 != null) {
                                sum += l2.val;
                                l2 = l2.next;
                            }

                            current.next = new ListNode(sum % 10);
                            carry = sum / 10;
                            current = current.next;
                        }

                        return dummy.next;
                    }
                }
                """;

        TestCase tc1 = new TestCase();
        tc1.setArguments(List.of("[2,4,3]", "[5,6,4]"));
        tc1.setExpectedOutput("[7,0,8]");

        TestCase tc2 = new TestCase();
        tc2.setArguments(List.of("[0]", "[0]"));
        tc2.setExpectedOutput("[0]");

        TestCase tc3 = new TestCase();
        tc3.setArguments(List.of("[9,9,9,9,9,9,9]", "[9,9,9,9]"));
        tc3.setExpectedOutput("[8,9,9,9,0,0,0,1]");

        String generated = generator.generate(userCode, null, List.of(tc1, tc2, tc3));

        assertTrue(generated.contains("public class Main"));
        assertTrue(generated.contains("class ListNode"));
        assertTrue(generated.contains("buildListNode("));
        assertTrue(generated.contains("formatListNode("));
        assertTrue(generated.contains("solution.addTwoNumbers(buildListNode(new int[]{2,4,3}), buildListNode(new int[]{5,6,4}))"));
        assertTrue(generated.contains("solution.addTwoNumbers(buildListNode(new int[]{0}), buildListNode(new int[]{0}))"));
        assertTrue(generated.contains("solution.addTwoNumbers(buildListNode(new int[]{9,9,9,9,9,9,9}), buildListNode(new int[]{9,9,9,9}))"));
    }

    @Test
    void testConvertArgument_ListNode() {
        assertEquals("buildListNode(new int[]{2,4,3})", generator.convertArgument("ListNode", "[2,4,3]"));
        assertEquals("null", generator.convertArgument("ListNode", "[]"));
        assertEquals("null", generator.convertArgument("ListNode", "null"));
        assertEquals("null", generator.convertArgument("ListNode", ""));
        assertEquals("new ListNode[]{}", generator.convertArgument("ListNode[]", "[]"));
        assertEquals("buildListNodeArray(new int[][]{{1,2},{3,4}})", generator.convertArgument("ListNode[]", "[[1,2],[3,4]]"));
    }

    @Test
    void testGenerate_UserCodeWithExistingListNode_DoesNotDuplicate() {
        String userCode = """
                class ListNode {
                    int val;
                    ListNode next;
                    ListNode(int val) { this.val = val; }
                }
                class Solution {
                    public ListNode test(ListNode l) {
                        return l;
                    }
                }
                """;

        String generated = generator.generate(userCode, null, List.of());

        // Count occurrences of "class ListNode"
        int firstIdx = generated.indexOf("class ListNode");
        int secondIdx = generated.indexOf("class ListNode", firstIdx + 1);
        assertTrue(firstIdx != -1, "Must contain class ListNode");
        assertEquals(-1, secondIdx, "Must not contain duplicate class ListNode");
    }
}

