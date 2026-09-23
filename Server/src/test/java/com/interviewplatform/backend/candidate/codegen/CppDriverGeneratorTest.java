package com.interviewplatform.backend.candidate.codegen;

import com.interviewplatform.backend.model.ExecutionMetadata;
import com.interviewplatform.backend.model.TestCase;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class CppDriverGeneratorTest {

    private CppDriverGenerator generator;

    @BeforeEach
    void setUp() {
        generator = new CppDriverGenerator();
    }

    @Test
    void testGenerate_SimpleAddMethod() {
        String userCode = """
                class Solution {
                public:
                    int add(int a, int b) {
                        return a + b;
                    }
                };
                """;

        ExecutionMetadata metadata = new ExecutionMetadata();
        metadata.setMethodName("add");
        metadata.setReturnType("int");
        metadata.setParameterTypes(List.of("int", "int"));

        TestCase testCase = new TestCase();
        testCase.setArguments(List.of("2", "3"));
        testCase.setExpectedOutput("5");

        String generated = generator.generate(userCode, metadata, List.of(testCase));

        // Verify standard headers and namespace
        assertTrue(generated.contains("#include <bits/stdc++.h>"));
        assertTrue(generated.contains("using namespace std;"));

        // Verify Solution class is preserved
        assertTrue(generated.contains("class Solution"));
        assertTrue(generated.contains("int add(int a, int b)"));

        // Verify main() outside Solution
        assertTrue(generated.contains("int main() {"));
        assertTrue(generated.contains("Solution solution;"));
        assertTrue(generated.contains("auto arg0 = 2;"));
        assertTrue(generated.contains("auto arg1 = 3;"));
        assertTrue(generated.contains("auto result = solution.add(arg0, arg1);"));
        assertTrue(generated.contains("printResult(result);"));
    }

    @Test
    void testGenerate_TwoSumVectorInputAndReturn() {
        String userCode = """
                class Solution {
                public:
                    vector<int> twoSum(vector<int>& nums, int target) {
                        unordered_map<int, int> map;
                        for (int i = 0; i < nums.size(); ++i) {
                            int complement = target - nums[i];
                            if (map.count(complement)) {
                                return {map[complement], i};
                            }
                            map[nums[i]] = i;
                        }
                        return {};
                    }
                };
                """;

        ExecutionMetadata metadata = new ExecutionMetadata();
        metadata.setMethodName("twoSum");
        metadata.setReturnType("int[]");
        metadata.setParameterTypes(List.of("int[]", "int"));

        TestCase testCase = new TestCase();
        testCase.setArguments(List.of("[2,7,11,15]", "9"));
        testCase.setExpectedOutput("[0,1]");

        String generated = generator.generate(userCode, metadata, List.of(testCase));

        assertTrue(generated.contains("#include <bits/stdc++.h>"));
        assertTrue(generated.contains("using namespace std;"));
        assertTrue(generated.contains("class Solution"));
        assertTrue(generated.contains("auto arg0 = vector<int>{2,7,11,15};"));
        assertTrue(generated.contains("auto arg1 = 9;"));
        assertTrue(generated.contains("auto result = solution.twoSum(arg0, arg1);"));
        assertTrue(generated.contains("printResult(result);"));
    }

    @Test
    void testGenerate_NQueensStyleMethodWithPrivateHelper() {
        String userCode = """
                class Solution {
                public:
                    vector<vector<string>> solveNQueens(int n) {
                        vector<vector<string>> result;
                        vector<string> board(n, string(n, '.'));
                        vector<int> col(n, 0);
                        vector<int> diag1(2 * n - 1, 0);
                        vector<int> diag2(2 * n - 1, 0);
                        solve(0, n, board, result, col, diag1, diag2);
                        return result;
                    }

                private:
                    void solve(int row, int n, vector<string>& board,
                               vector<vector<string>>& result,
                               vector<int>& col,
                               vector<int>& diag1,
                               vector<int>& diag2) {
                        if (row == n) {
                            result.push_back(board);
                            return;
                        }
                        for (int c = 0; c < n; c++) {
                            if (col[c] || diag1[row - c + n - 1] || diag2[row + c]) continue;
                            board[row][c] = 'Q';
                            col[c] = 1; diag1[row - c + n - 1] = 1; diag2[row + c] = 1;
                            solve(row + 1, n, board, result, col, diag1, diag2);
                            board[row][c] = '.';
                            col[c] = 0; diag1[row - c + n - 1] = 0; diag2[row + c] = 0;
                        }
                    }
                };
                """;

        TestCase testCase = new TestCase();
        testCase.setArguments(List.of("4"));
        testCase.setExpectedOutput("[[\".Q..\",\"...Q\",\"Q...\",\"..Q.\"],[\"..Q.\",\"Q...\",\"...Q\",\".Q..\"]]");

        // Test with null metadata to verify resilient method extraction
        String generated = generator.generate(userCode, null, List.of(testCase));

        // Headers
        assertTrue(generated.contains("#include <bits/stdc++.h>"));
        assertTrue(generated.contains("using namespace std;"));

        // Helper printing utilities
        assertTrue(generated.contains("void printResult(const vector<T>& vec)"));

        // Solution class and private helper method are both intact inside Solution
        int classIndex = generated.indexOf("class Solution");
        int privateIndex = generated.indexOf("private:");
        int mainIndex = generated.indexOf("int main()");

        assertTrue(classIndex != -1, "class Solution must be present");
        assertTrue(privateIndex > classIndex, "private: solve must be after class Solution starts");
        assertTrue(mainIndex > privateIndex, "main() must be generated after class Solution closes");

        // Method invocation in main()
        assertTrue(generated.contains("Solution solution;"));
        assertTrue(generated.contains("auto arg0 = 4;"));
        assertTrue(generated.contains("auto result = solution.solveNQueens(arg0);"));
        assertTrue(generated.contains("printResult(result);"));
    }

    @Test
    void testGenerate_VoidMethod_PrintsModifiedArgument() {
        String userCode = """
                class Solution {
                public:
                    void moveZeroes(vector<int>& nums) {
                        int insertPos = 0;
                        for (int num : nums) {
                            if (num != 0) nums[insertPos++] = num;
                        }
                        while (insertPos < nums.size()) nums[insertPos++] = 0;
                    }
                };
                """;

        ExecutionMetadata metadata = new ExecutionMetadata();
        metadata.setMethodName("moveZeroes");
        metadata.setReturnType("void");
        metadata.setParameterTypes(List.of("int[]"));

        TestCase testCase = new TestCase();
        testCase.setArguments(List.of("[0,1,0,3,12]"));
        testCase.setExpectedOutput("[1,3,12,0,0]");

        String generated = generator.generate(userCode, metadata, List.of(testCase));

        assertTrue(generated.contains("solution.moveZeroes(arg0);"));
        assertTrue(generated.contains("printResult(arg0);"));
        assertFalse(generated.contains("auto result = solution.moveZeroes"));
    }

    @Test
    void testGenerate_AddTwoNumbersLinkedList_WithMetadata() {
        String userCode = """
                /**
                 * Definition for singly-linked list.
                 * struct ListNode {
                 *     int val;
                 *     ListNode *next;
                 *     ListNode() : val(0), next(nullptr) {}
                 *     ListNode(int x) : val(x), next(nullptr) {}
                 *     ListNode(int x, ListNode *next) : val(x), next(next) {}
                 * };
                 */
                class Solution {
                public:
                    ListNode* addTwoNumbers(ListNode* l1, ListNode* l2) {
                        ListNode* dummy = new ListNode(0);
                        ListNode* current = dummy;
                        int carry = 0;
                        while (l1 != nullptr || l2 != nullptr || carry != 0) {
                            int sum = carry;
                            if (l1 != nullptr) { sum += l1->val; l1 = l1->next; }
                            if (l2 != nullptr) { sum += l2->val; l2 = l2->next; }
                            current->next = new ListNode(sum % 10);
                            carry = sum / 10;
                            current = current->next;
                        }
                        return dummy->next;
                    }
                };
                """;

        ExecutionMetadata metadata = new ExecutionMetadata();
        metadata.setMethodName("addTwoNumbers");
        metadata.setReturnType("ListNode");
        metadata.setParameterTypes(List.of("ListNode", "ListNode"));

        TestCase tc1 = new TestCase();
        tc1.setArguments(List.of("[2,4,3]", "[5,6,4]"));
        tc1.setExpectedOutput("[7,0,8]");

        TestCase tc2 = new TestCase();
        tc2.setArguments(List.of("[0]", "[0]"));
        tc2.setExpectedOutput("[0]");

        TestCase tc3 = new TestCase();
        tc3.setArguments(List.of("[9,9,9,9,9,9,9]", "[9,9,9,9]"));
        tc3.setExpectedOutput("[8,9,9,9,0,0,0,1]");

        String generated = generator.generate(userCode, metadata, List.of(tc1, tc2, tc3));

        // Injected struct ListNode before class Solution
        assertTrue(generated.contains("struct ListNode {"));
        int structIndex = generated.indexOf("struct ListNode {");
        int classIndex = generated.indexOf("class Solution");
        assertTrue(structIndex != -1 && structIndex < classIndex, "struct ListNode must precede class Solution");

        // Helper printing utilities & ListNode printer
        assertTrue(generated.contains("void printResult(ListNode* head)"));
        assertTrue(generated.contains("ListNode* buildListNode(const vector<int>& vals)"));

        // Test case argument building
        assertTrue(generated.contains("auto arg0 = buildListNode(vector<int>{2,4,3});"));
        assertTrue(generated.contains("auto arg1 = buildListNode(vector<int>{5,6,4});"));
        assertTrue(generated.contains("auto result = solution.addTwoNumbers(arg0, arg1);"));
        assertTrue(generated.contains("printResult(result);"));
    }

    @Test
    void testGenerate_AddTwoNumbersLinkedList_WithNullMetadata_FallbackExtraction() {
        String userCode = """
                class Solution {
                public:
                    ListNode* addTwoNumbers(ListNode* l1, ListNode* l2) {
                        return nullptr;
                    }
                };
                """;

        TestCase tc = new TestCase();
        tc.setArguments(List.of("[2,4,3]", "[5,6,4]"));
        tc.setExpectedOutput("[7,0,8]");

        // Pass null metadata
        String generated = generator.generate(userCode, null, List.of(tc));

        assertTrue(generated.contains("auto arg0 = buildListNode(vector<int>{2,4,3});"));
        assertTrue(generated.contains("auto arg1 = buildListNode(vector<int>{5,6,4});"));
        assertTrue(generated.contains("auto result = solution.addTwoNumbers(arg0, arg1);"));
        assertTrue(generated.contains("printResult(result);"));
    }

    @Test
    void testGenerate_UserDefinesListNode_DoesNotDuplicateStruct() {
        String userCode = """
                struct ListNode {
                    int val;
                    ListNode *next;
                    ListNode(int x) : val(x), next(nullptr) {}
                };
                class Solution {
                public:
                    ListNode* reverseList(ListNode* head) {
                        return head;
                    }
                };
                """;

        TestCase tc = new TestCase();
        tc.setArguments(List.of("[1,2,3]"));

        String generated = generator.generate(userCode, null, List.of(tc));

        // Count occurrences of "struct ListNode {"
        int firstIdx = generated.indexOf("struct ListNode {");
        int secondIdx = generated.indexOf("struct ListNode {", firstIdx + 1);
        assertTrue(firstIdx != -1, "struct ListNode must be present");
        assertEquals(-1, secondIdx, "struct ListNode should not be duplicated if already defined in user code");
    }

    @Test
    void testConvertArgument_ListNode_Variants() {
        assertEquals("buildListNode(vector<int>{2,4,3})", generator.convertArgument("[2,4,3]", "ListNode*"));
        assertEquals("buildListNode(vector<int>{2,4,3})", generator.convertArgument("[2,4,3]", "ListNode"));
        assertEquals("nullptr", generator.convertArgument("[]", "ListNode*"));
        assertEquals("nullptr", generator.convertArgument("null", "ListNode"));
        assertEquals("nullptr", generator.convertArgument("nullptr", "ListNode*"));

        assertEquals("buildListNodeVector(vector<vector<int>>{{1,4,5},{1,3,4}})",
                generator.convertArgument("[[1,4,5],[1,3,4]]", "vector<ListNode*>"));
        assertEquals("buildListNodeVector(vector<vector<int>>{{1,4,5},{1,3,4}})",
                generator.convertArgument("[[1,4,5],[1,3,4]]", "ListNode[]"));
        assertEquals("vector<ListNode*>{}", generator.convertArgument("[]", "vector<ListNode*>"));
    }
}
